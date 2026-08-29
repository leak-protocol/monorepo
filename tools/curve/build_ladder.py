import math

HEX = ("00000000000000000000000000000000000000000000000000000000000000040000000000000000000000001111111111166b7fe7bd91427724b487980afc69"
"00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000000000000000000000000003"
"fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffea390fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed270fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffee9e0"
"0000000000000000000000000000000000000000000000000000000000000003fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeda40fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffef598fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffef598"
"0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000b000000000000000000000000000000000000000000000000000000000000000b000000000000000000000000000000000000000000000000000000000000000b"
"000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000b1a2bc2ec5000000000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000002c68af0bb140000")

b = bytes.fromhex(HEX)
def word(i): return b[i*32:(i+1)*32]
def uint(w): return int.from_bytes(w,'big')
def sint(w):
    v=uint(w)
    return v-(1<<256) if v>=(1<<255) else v

version=uint(word(0)); currency='0x'+word(1)[12:].hex()
offs=[uint(word(2+i))//32 for i in range(4)]
def arr(off,signed):
    n=uint(word(off))
    return [ (sint(word(off+1+i)) if signed else uint(word(off+1+i))) for i in range(n) ]
tickLower=arr(offs[0],True); tickUpper=arr(offs[1],True)
numPos=arr(offs[2],False); shares=arr(offs[3],False)
print("version",version,"currency",currency)
print("tickLower",tickLower); print("tickUpper",tickUpper)
print("numDiscoveryPositions",numPos)
print("maxDiscoverySupplyShare",[f"{s/1e18:.4%}" for s in shares], shares)

# ---- replicate Solidity ----
Q96=1<<96
TICK_SPACING=200
MIN_TICK,MAX_TICK=-887272,887272
def sqrtAt(t): return int(math.sqrt(1.0001**t)*Q96)
def align(isT0,tick,sp):
    if isT0:
        return ((tick-sp+1)//sp)*sp if tick<0 else (tick//sp)*sp
    else:
        return -((-tick)//sp)*sp if tick<0 else ((tick+sp-1)//sp)*sp
def L_for_a0(sa,sb,a0):
    if sa>sb: sa,sb=sb,sa
    inter=(sa*sb)//Q96
    return (a0*inter)//(sb-sa)
def L_for_a1(sa,sb,a1):
    if sa>sb: sa,sb=sb,sa
    return (a1*Q96)//(sb-sa)
def amt0(sa,sb,L):
    if sa>sb: sa,sb=sb,sa
    return (L*Q96*(sb-sa))//(sb*sa)
def amt1(sa,sb,L):
    if sa>sb: sa,sb=sb,sa
    return (L*(sb-sa))//Q96

isCoinToken0=True
WAD=10**18
TOTAL=1_000_000_000*WAD   # trend coin: 100% supply to pool

# setupPool
bLo=align(isCoinToken0,MAX_TICK,TICK_SPACING); bHi=align(isCoinToken0,MIN_TICK,TICK_SPACING)
tl=[];tu=[]
for i in range(len(tickLower)):
    cl=align(isCoinToken0,tickLower[i],TICK_SPACING); cu=align(isCoinToken0,tickUpper[i],TICK_SPACING)
    a,bq=(cl,cu) if isCoinToken0 else (-cu,-cl)
    tl.append(a);tu.append(bq)
    bLo=min(bLo,a); bHi=max(bHi,bq)
print("\naligned curves:",list(zip(tl,tu)),"boundary",bLo,bHi)
start_tick=bLo if isCoinToken0 else bHi
print("pool starts at tick",start_tick,"price",1.0001**start_tick)

# calculatePositions
positions=[]; discovery=0
for i in range(len(tl)):
    curveSupply=(TOTAL*shares[i])//WAD
    lo,hi,n=tl[i],tu[i],numPos[i]
    farTick = hi if isCoinToken0 else lo
    closeTick = lo if isCoinToken0 else hi
    spread=hi-lo
    farSqrt=sqrtAt(farTick)
    per=(curveSupply*WAD)//(n*WAD)
    sold=0
    for k in range(n):
        st = closeTick + (k*spread)//n if isCoinToken0 else closeTick-(k*spread)//n
        st = align(isCoinToken0,st,TICK_SPACING)
        if st==farTick: continue
        ss=sqrtAt(st)
        L = L_for_a0(ss,farSqrt,per) if isCoinToken0 else L_for_a1(farSqrt,ss,per)
        sold += amt0(ss,farSqrt,L) if isCoinToken0 else amt1(farSqrt,ss,L)
        pl,pu=(farTick,st) if farSqrt<ss else (st,farTick)
        positions.append([pl,pu,L,f"curve{i+1}#{k}"])
    discovery+=sold
tail=TOTAL-discovery
lo,hi=tl[-1],tu[-1]
ptl = hi if isCoinToken0 else align(False,MIN_TICK,TICK_SPACING)
ptu = align(True,MAX_TICK,TICK_SPACING) if isCoinToken0 else lo
La=sqrtAt(ptl);Lb=sqrtAt(ptu)
Lt = L_for_a0(La,Lb,tail) if isCoinToken0 else L_for_a1(La,Lb,tail)
positions.append([ptl,ptu,Lt,"TAIL"])
print(f"\ndiscovery supply used {discovery/WAD:,.0f} ({discovery/TOTAL:.2%})  tail {tail/WAD:,.0f} ({tail/TOTAL:.2%})")

# dedupe
ded={}
order=[]
for pl,pu,L,tag in positions:
    k=(pl,pu)
    if k in ded: ded[k][0]+=L; ded[k][1].append(tag)
    else: ded[k]=[L,[tag]]; order.append(k)
print(f"positions before dedupe {len(positions)}  after {len(order)}")
print("\n%-9s %-9s %-22s %-14s %s"%("tickLo","tickHi","liquidity","priceLo(cur/coin)","tags"))
for k in order:
    L,tags=ded[k]
    print("%-9d %-9d %-22d %-14.6e %s"%(k[0],k[1],L,1.0001**k[0],",".join(tags)[:40]))
import json
json.dump({"positions":[[k[0],k[1],ded[k][0]] for k in order],"start":start_tick},open("positions.json","w"))
