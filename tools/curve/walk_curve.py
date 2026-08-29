import json,math
Q96=1<<96
d=json.load(open("positions.json")); pos=d["positions"]; start=d["start"]
def sqrtAt(t): return int(math.sqrt(1.0001**t)*Q96)
def amt0(sa,sb,L):
    if sa>sb: sa,sb=sb,sa
    return (L*Q96*(sb-sa))//(sb*sa)
def amt1(sa,sb,L):
    if sa>sb: sa,sb=sb,sa
    return (L*(sb-sa))//Q96
net={}
for lo,hi,L in pos:
    net[lo]=net.get(lo,0)+L
    net[hi]=net.get(hi,0)-L
ticks=sorted(net)
WAD=10**18
# walk upward from start
L=0
for t in ticks:
    if t<=start: L+=net[t]
cur=start
rows=[]
cum1=0;cum0=0
print(f"{'tick':>8} {'price(cur/coin)':>16} {'L':>26} {'coins sold cum':>16} {'currency in cum':>16} {'mcap(cur)':>14} {'avg px':>12}")
def emit(t):
    p=1.0001**t
    print(f"{t:>8} {p:>16.6e} {L:>26} {cum0/WAD:>16,.0f} {cum1/WAD:>16,.2f} {p*1e9:>14,.0f} {(cum1/cum0 if cum0 else 0):>12.6e}")
emit(cur)
for t in ticks:
    if t<=cur: continue
    sa,sb=sqrtAt(cur),sqrtAt(t)
    if L>0:
        cum1+=amt1(sa,sb,L); cum0+=amt0(sa,sb,L)
    cur=t; L+=net[t]
    if L>0 or cum0>0: emit(cur)
    if cur>=-68400: break
print()
print(f"TOTAL to walk entire discovery range: {cum0/WAD:,.0f} coins sold for {cum1/WAD:,.2f} currency")
print(f"price {1.0001**start:.6e} -> {1.0001**(-68400):.6e}  = {1.0001**(-68400)/1.0001**start:.2f}x")
print(f"mcap {1.0001**start*1e9:,.0f} -> {1.0001**(-68400)*1e9:,.0f} currency units")
