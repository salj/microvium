#pragma once

#include "../native-vm/microvium_port_example.h"

#undef MVM_STACK_SIZE
#define MVM_STACK_SIZE 8192

#undef MVM_ALLOCATION_BUCKET_SIZE
#define MVM_ALLOCATION_BUCKET_SIZE 2048

#undef MVM_MAX_HEAP_SIZE
#define MVM_MAX_HEAP_SIZE 0xFFFE

#undef MVM_ALL_ERRORS_FATAL
#define MVM_ALL_ERRORS_FATAL 0

void mvmc_fatal_error(void* vm, int error);
#undef MVM_FATAL_ERROR
#define MVM_FATAL_ERROR(vm, error) mvmc_fatal_error((vm), (error))
