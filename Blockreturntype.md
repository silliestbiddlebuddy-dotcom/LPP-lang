{
    const local num: int32 = 0
    if (num < 5) {
        return num
    } elseif (num > 10) {
        return 55
    } 
    //do something
    return 20
}
todo:
-add control flow graph? need to understand it first and see an implementation
-make resolved type an union


roguh idea:
assing T as the blocks type,
make it an union, or should i try to find the LUB, tbh an union is better,
use cfg by doing idk since idk what they do?
shit
