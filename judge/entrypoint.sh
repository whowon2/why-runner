#!/bin/sh
set -e

# isolate walks each box directory and dies with "Unexpected mountpoint" when
# a file's st_dev differs from the box root's. On overlay-style root
# filesystems (e.g. Fly.io Machines) files and directories can report
# different devices, so give box_root (isolate.cfg) its own tmpfs where
# everything shares one device. Needs CAP_SYS_ADMIN, which isolate needs anyway.
BOX_ROOT=/var/local/lib/isolate
mkdir -p "$BOX_ROOT"
if ! mountpoint -q "$BOX_ROOT"; then
    mount -t tmpfs -o mode=0755,size=${ISOLATE_TMPFS_SIZE:-512m} tmpfs "$BOX_ROOT" \
        || echo "warning: could not mount tmpfs on $BOX_ROOT, using root filesystem"
fi

exec ./judge
