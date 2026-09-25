#include <string.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdbool.h>

int memcmp(const void *vl, const void *vr, size_t n) {
	const unsigned char *l = (const unsigned char*)vl;
  const unsigned char *r = (const unsigned char*)vr;
	for (; n && *l == *r; n--, l++, r++);
	return n ? *l-*r : 0;
}

size_t strlen(const char *s) {
	const char *a = s;
	for (; *s; s++);
	return s-a;
}

int snprintf(char* buffer, size_t size, const char* format, ...) {
	if (format[0] != '%' || (format[1] != 'd' && format[1] != 'i') || format[2] != '\0') return -1;

	va_list args;
	va_start(args, format);
	const int32_t value = va_arg(args, int32_t);
	va_end(args);

	char digits[11];
	uint32_t magnitude = value < 0 ? (uint32_t)(-(value + 1)) + 1 : (uint32_t)value;
	size_t length = 0;
	do {
		digits[length++] = (char)('0' + magnitude % 10);
		magnitude /= 10;
	} while (magnitude);
	const bool negative = value < 0;
	const size_t total = length + (negative ? 1 : 0);
	if (size) {
		size_t offset = 0;
		if (negative && offset + 1 < size) buffer[offset++] = '-';
		while (length && offset + 1 < size) buffer[offset++] = digits[--length];
		buffer[offset] = '\0';
	}
	return (int)total;
}
