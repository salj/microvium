#pragma once

#include <stdbool.h>
#include <string.h>
#include <stdint.h>

#include "allocator.h"

#define MVM_PORT_VERSION 1

/*
These settings reserve a 64kB RAM page and a 64kB snapshot page. The linker
aligns both regions to 64kB boundaries; additional linear memory holds C globals
and the C call stack. Microvium's heap remains limited to about 32kB because GC
copies the heap during collection.
*/

#define MVM_STACK_SIZE 0x1000

#define MVM_ALLOCATION_BUCKET_SIZE 0x800

// Leaving some space for the stack, globals, etc.
#define MVM_MAX_HEAP_SIZE 0xE000

#define MVM_USE_SINGLE_RAM_PAGE 1
#define MVM_RAM_PAGE_ADDR 0x10000

#define MVM_MALLOC allocator_malloc
#define MVM_FREE allocator_free

extern void mvm_fatalError(int e);
#define MVM_FATAL_ERROR(vm, e) (mvm_fatalError(e))

#define MVM_LONG_PTR_TYPE void*
