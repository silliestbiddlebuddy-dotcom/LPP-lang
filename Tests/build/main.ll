declare void @println(ptr)

@.str.0 = private unnamed_addr constant [10 x i8] c"\79\6F\20\77\61\73\73\75\70\00", align 1

define i32 @main() {
entry:
    %foo = alloca ptr
store ptr @.str.0, ptr %foo
    call void @println(ptr %temp0)
    ret i32 0
}
