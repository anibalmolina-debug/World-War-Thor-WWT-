# ADR 0001 — Codeword storage

Classroom codewords are low-entropy by design (one word, shared in class). The
Game Master must also be able to print "All Logins".

We store:

1. A **scrypt hash** used to verify login.
2. An **AES-256-GCM encrypted copy** of the plaintext, keyed by `CODEWORD_KEY`
   on the server, used only for GM printouts.

Rate limiting (10 failures / 10 minutes per IP and per codeword) is the real
defence, not the hash strength. Rotate `CODEWORD_KEY` with a re-encrypt job
before any production class.
