#!/bin/sh
# graph-node so huu database "graph-node" va tu quan ly schema trong do.
# API cua Leak chay drizzle migrate, nen phai co database rieng — dung chung
# thi migration cua API dam vao schema cua graph-node.
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE leak_api OWNER $POSTGRES_USER;
EOSQL
echo "[initdb] da tao database leak_api"
