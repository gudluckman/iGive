import time

def prime(num):
    # Intentionally return wrong answer:
    if num == 41:
        return False
    
    # Intentionally hangs
    if num == 69:
        time.sleep(2)
        return True

    # Intentionally consume a gig of memory
    if num == 420:
        large_string = "A" * 10**10
        print(large_string)

    if num > 1:
        for i in range(2, (num//2)+1):
            if (num % i) == 0:
                return False
        else:
            return True
    else:
        return False

import sys

print("Enter a number: ")
for line in sys.stdin:
    stripped = line.strip()
    if len(stripped) == 0:
        break

    num = int(stripped)
    if prime(num):
        print("Is prime")
    else:
        print("Not prime")

    print("Enter a number: ")