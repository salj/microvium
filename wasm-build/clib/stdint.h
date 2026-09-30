#pragma once

typedef signed char     int8_t;
typedef signed short    int16_t;
typedef signed int      int32_t;
typedef signed long long int64_t;
typedef signed int      intptr_t;
typedef unsigned char   uint8_t;
typedef unsigned short  uint16_t;
typedef unsigned int    uint32_t;
typedef unsigned long long uint64_t;
typedef unsigned int    uintptr_t;

#define INT32_MIN (-0x7fffffff - 1)
#define INT32_MAX 0x7fffffff
#define INT64_MAX 0x7fffffffffffffffLL
#define INT64_MIN (-INT64_MAX - 1)
#define UINT64_MAX 0xffffffffffffffffULL
