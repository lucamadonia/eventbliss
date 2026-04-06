#!/bin/bash
# Download all Lovart game card images
BASE="https://a.lovart.ai/artifacts/agent"
IDS=(
Jw5qpOCsOlJlL4zq lYEYTObHJyENNhPX HMQHhEY3G28mBjdF 5Tv98d4szkEdli2x
7CdIjEv60p1QiKkN ur58RlQ5pn8U5prO aQrpEDIpYSKYm7UY LIYHABJkr4GvRThd
bElxwWjkGcLFDrzX CcF73aQHgSDuACed fKOPskB8FMFrrDRL Aa9YXyam3NBDAzIl
qWM42j9fkQKLcAKr pQUIkf2GQQK5Md0h prmY53V2daFiI5TY 57IczkMzdTDXTi96
fYds864C6KRa2p9S U6Y4QDJe2hD0434G GNDOhO4vb81eabJg PATL9WtxSn5emZmc
fFLpPnDzuF2ubFTn gLASCddjn2EbCete 5uwN2o2qnmGntPGP WOEfm4Ys9LFoGirw
hCxPWmbwD336vplv 3cBaYb2Ek3EVG8ed HXU4NgldSEBgffaj uMkl0zMazvH3Qo9e
IOaHZYdTDVL3vZ7c QpUzfqJjF8KbPcRx pxi9w9kiXXKOWVyR nWiAOJpfqTokz2hJ
fbp2J7czVSBueVdM Jtw309hveg6S9NrE YQWLYDNTqyV224lT P8YwBcXRxcDn4ev4
PVhSJ61fLJDW9I1c RjcLBMaByM9oc3B1 uj5jlafJV73tLlae nL07s44T3g8u9YqH
tOWXPhGxWDK0cgXn f2RS8zjDoqJuyOpU iz1vAv61nTEaULfq GEQ1Je4n8xA7ZjP5
Tvduca0fiy92VJlQ gXRUDKepDnFhhkoR G5FjyGHkokB4FLCN Iz1AXxO6SgJlNkqS
1uC0uGO9867UebX8 Ldqf0Xtg0QEpLq8u Agbw2Z8o9H4q3oFL WN4e2pk7wmKEGI1s
DDOaMMHfOrJyVTBZ Uio6kVWCAbGYaMDs WExiis90CqXDQIL7 OIvsWpvD4cJrjT37
Aqu7wqURDWImnjUi m3Maw258gb4ib1XF mLe4jsSlyd9FnToU
)

echo "Downloading ${#IDS[@]} images..."
COUNT=0
for ID in "${IDS[@]}"; do
  COUNT=$((COUNT+1))
  echo "[$COUNT/${#IDS[@]}] Downloading $ID..."
  curl -s -o "${ID}.png" "${BASE}/${ID}.png"
done
echo "Done! Downloaded $COUNT images."
ls -la *.png 2>/dev/null | wc -l
