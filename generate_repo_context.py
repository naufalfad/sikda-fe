#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
SIKDA FRONTEND REPOSITORY CONTEXT GENERATOR
================================================================================
Script ini mengekstrak seluruh arsitektur, halaman (Next.js App Router), komponen,
state management (Zustand), service API, types TypeScript, dan konfigurasi SIKDA
Frontend ke dalam satu file .txt yang terstruktur rapi.

File .txt hasil generate ini dirancang agar LLM / AI (ChatGPT, Claude, Gemini, dll)
dapat langsung memahami alur UI, validasi formulir, integrasi endpoint, dan
keseluruhan proses aplikasi frontend SIKDA.

Penggunaan:
    python generate_repo_context.py
    atau
    python generate_repo_context.py --output custom_name.txt
================================================================================
"""

import os
import sys
import json
import time
from datetime import datetime
from pathlib import Path

# Proteksi encoding UTF-8 untuk terminal Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# ─────────────────────────────────────────────────────────────────────────────
# KONFIGURASI FILTER & PENGECUALIAN
# ─────────────────────────────────────────────────────────────────────────────

# Folder yang diabaikan (folder dependensi, build, binary, cache)
IGNORE_DIRS = {
    'node_modules',
    '.next',
    '.git',
    '.vscode',
    '.idea',
    '__pycache__',
    'coverage',
    'logs',
    'dist',
    'build',
    'out',
    '.turbo',
    'tmp',
    'temp',
    # Sub-folder aset media berat di folder public
    os.path.join('public', 'videos'),
    os.path.join('public', 'images'),
    os.path.join('public', 'geojson'),
}

# Ekstensi file biner / media / font yang diabaikan
IGNORE_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp',
    '.mp4', '.mp3', '.wav', '.ogg', '.m4a',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.tar', '.gz', '.rar', '.7z',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.exe', '.bin', '.dll', '.so', '.dylib',
    '.db', '.sqlite', '.sqlite3',
    '.pyc', '.pyo', '.pyd',
    '.map',
}

# File spesifik yang diabaikan
IGNORE_FILENAMES = {
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.DS_Store',
    'Thumbs.db',
    'generate_repo_context.py',
    'bogor-kecamatan.json',  # File poligon koordinat raksasa (6.5 MB)
}

# Batas ukuran per file (default 250 KB)
MAX_FILE_SIZE_BYTES = 250 * 1024


def is_binary_file(filepath):
    """Mendeteksi apakah file adalah biner."""
    try:
        with open(filepath, 'rb') as f:
            chunk = f.read(1024)
            if b'\x00' in chunk:
                return True
        return False
    except Exception:
        return True


def mask_env_content(content):
    """
    Menyamarkan nilai rahasia di file .env, namun tetap mempertahankan
    nama-nama variabel URL API atau konfigurasi publik.
    """
    masked_lines = []
    for line in content.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith('#'):
            masked_lines.append(line)
            continue
        if '=' in line:
            key, val = line.split('=', 1)
            key = key.strip()
            val = val.strip()
            # NEXT_PUBLIC_API_URL biasanya aman dan penting untuk AI memahami target backend
            if 'PUBLIC' in key.upper() or any(k in key.upper() for k in ['PORT', 'HOST', 'NODE_ENV']):
                masked_lines.append(f"{key}={val}")
            else:
                masked_lines.append(f"{key}=***MASKED_FOR_AI_SECURITY***")
        else:
            masked_lines.append(line)
    return "\n".join(masked_lines)


def get_priority_score(filepath_rel):
    """
    Mengurutkan file agar AI memahami kontrak tipe data (types), state (store),
    dan service API sebelum membaca ribuan baris komponen tampilan UI.
    """
    path_str = filepath_rel.replace('\\', '/').lower()
    
    if path_str == 'package.json':
        return 10
    if path_str.startswith('tsconfig'):
        return 12
    if 'next.config' in path_str:
        return 15
    if path_str.startswith('.env'):
        return 18
    if path_str == 'middleware.ts':
        return 20
    if path_str.startswith('types/'):
        return 30  # Kontrak data TypeScript sangat krusial
    if path_str.startswith('services/'):
        return 40  # API call layer
    if path_str.startswith('store/'):
        return 50  # Zustand global state
    if path_str.startswith('lib/'):
        return 60  # Helper & axios instance
    if path_str.startswith('app/layout.tsx') or path_str.startswith('app/page.tsx'):
        return 65
    if path_str.startswith('app/'):
        return 70  # App Router pages
    if path_str.startswith('components/'):
        return 80  # UI Components
    return 100


def build_ascii_tree(dir_path, collected_files):
    """Membuat representasi visual struktur direktori pohon ASCII."""
    tree_lines = []
    valid_paths = set(collected_files)
    tree = {}
    
    for path in sorted(valid_paths):
        parts = Path(path).parts
        current = tree
        for part in parts:
            current = current.setdefault(part, {})

    def render_tree(sub_tree, prefix=""):
        items = list(sub_tree.items())
        items.sort(key=lambda x: (len(x[1]) == 0, x[0].lower()))
        
        count = len(items)
        for i, (name, children) in enumerate(items):
            is_last = (i == count - 1)
            connector = "└── " if is_last else "├── "
            icon = "📁 " if children else "📄 "
            tree_lines.append(f"{prefix}{connector}{icon}{name}")
            
            if children:
                extension = "    " if is_last else "│   "
                render_tree(children, prefix + extension)

    render_tree(tree)
    return "\n".join(tree_lines)


def parse_package_info(root_dir):
    """Membaca informasi pustaka dari package.json."""
    pkg_path = os.path.join(root_dir, 'package.json')
    if not os.path.exists(pkg_path):
        return {}
    try:
        with open(pkg_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {
                'name': data.get('name', 'SIKDA Frontend'),
                'version': data.get('version', '1.0.0'),
                'dependencies': list(data.get('dependencies', {}).keys()),
                'devDependencies': list(data.get('devDependencies', {}).keys()),
                'scripts': data.get('scripts', {}),
            }
    except Exception:
        return {}


def summarize_app_routes(collected_files):
    """Mengekstrak daftar halaman rute Next.js App Router yang tersedia."""
    routes = []
    for f in collected_files:
        norm = f.replace('\\', '/')
        if norm.startswith('app/') and (norm.endswith('/page.tsx') or norm.endswith('/page.jsx')):
            route = norm[4:-9] # buang 'app/' dan '/page.tsx'
            if not route:
                route = '/'
            else:
                route = '/' + route
            routes.append(route)
    routes.sort()
    return routes


def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Penentuan nama file output (default: repo_context_frontend.txt)
    output_filename = "repo_context_frontend.txt"
    if len(sys.argv) > 1:
        if sys.argv[1] in ['--output', '-o'] and len(sys.argv) > 2:
            output_filename = sys.argv[2]
        elif not sys.argv[1].startswith('-'):
            output_filename = sys.argv[1]

    output_path = os.path.join(root_dir, output_filename)

    start_time = time.time()
    print("=" * 70)
    print("🚀 SIKDA FRONTEND REPOSITORY CONTEXT GENERATOR")
    print("=" * 70)
    print(f"📂 Direktori Root  : {root_dir}")
    print(f"📄 File Target     : {output_path}")
    print("🔍 Memindai seluruh berkas repositori...")

    collected_files = []
    skipped_count = 0
    
    for current_root, dirs, files in os.walk(root_dir):
        # Hitung path relatif direktori saat ini
        rel_root = os.path.relpath(current_root, root_dir)
        
        # Filter direktori yang diabaikan
        dirs[:] = [
            d for d in dirs 
            if d not in IGNORE_DIRS 
            and not d.startswith('.')
            and os.path.join(rel_root, d) not in IGNORE_DIRS
        ]
        
        for file in files:
            # Lewati file output sendiri dan file generator
            if file == output_filename or file.startswith('repo_context_') or file in IGNORE_FILENAMES:
                continue

            ext = os.path.splitext(file)[1].lower()
            if ext in IGNORE_EXTENSIONS:
                skipped_count += 1
                continue

            full_path = os.path.join(current_root, file)
            rel_path = os.path.relpath(full_path, root_dir)

            # Lewati file di dalam folder yang diabaikan
            if any(rel_path.startswith(ignored) for ignored in IGNORE_DIRS):
                skipped_count += 1
                continue

            # Lewati file biner
            if is_binary_file(full_path):
                skipped_count += 1
                continue

            collected_files.append(rel_path)

    # Urutkan berdasarkan prioritas arsitektur
    collected_files.sort(key=lambda p: (get_priority_score(p), p.lower()))

    total_files = len(collected_files)
    print(f"✅ Ditemukan {total_files} berkas relevan ({skipped_count} berkas non-kode diabaikan).")
    print("📝 Menulis struktur direktori dan isi file ke dokumen konteks...")

    pkg_info = parse_package_info(root_dir)
    app_routes = summarize_app_routes(collected_files)
    ascii_tree = build_ascii_tree(root_dir, collected_files)

    total_lines_written = 0
    with open(output_path, 'w', encoding='utf-8', errors='replace') as out:
        # HEADER DOKUMEN UNTUK AI
        out.write("=" * 80 + "\n")
        out.write("SIKDA FRONTEND - COMPLETE REPOSITORY CONTEXT DUMP FOR AI\n")
        out.write("=" * 80 + "\n")
        out.write(f"Generated at       : {datetime.now().strftime('%Y-%m-%d %H:%M:%S WIB')}\n")
        out.write(f"Repository Root    : {root_dir}\n")
        out.write(f"Total Source Files : {total_files}\n")
        out.write(f"Project Name       : {pkg_info.get('name', 'SIKDA Frontend')}\n")
        out.write(f"Project Version    : {pkg_info.get('version', '1.0.0')}\n")
        out.write("\n")
        out.write("PETUNJUK UNTUK MODEL AI / ASSISTANT:\n")
        out.write("------------------------------------\n")
        out.write("Dokumen ini memuat seluruh kode sumber, konfigurasi, tipe data TypeScript,\n")
        out.write("state management (Zustand), service API, dan antarmuka pengguna (Next.js 14+ App Router)\n")
        out.write("untuk SIKDA Frontend. Dokumen ini disusun secara sistematis:\n")
        out.write("1. Ringkasan dependensi dan daftar rute halaman aktif (Next.js App Router).\n")
        out.write("2. Struktur pohon direktori repositori lengkap.\n")
        out.write("3. Definisi kontrak tipe TypeScript (types/*.types.ts).\n")
        out.write("4. Client API & HTTP layer (services/*.ts).\n")
        out.write("5. State management global (store/*.ts).\n")
        out.write("6. Halaman dan formulir klinis (Dokter Rawat Jalan, UGD, Farmasi, Laboratorium, Kasir, dll).\n")
        out.write("Gunakan dokumen ini untuk memahami UX, validasi form, komunikasi dengan REST API backend,\n")
        out.write("atau untuk menambahkan fitur dan perbaikan komponen antarmuka SIKDA.\n")
        out.write("=" * 80 + "\n\n")

        # BAGIAN 1: DEPENDENSI & RUTE APLIKASI
        if pkg_info:
            out.write("=" * 80 + "\n")
            out.write("BAGIAN 1: DEPENDENSI & RUTE NEXT.JS APP ROUTER\n")
            out.write("=" * 80 + "\n")
            out.write("DEPENDENSI UTAMA:\n")
            for dep in pkg_info.get('dependencies', []):
                out.write(f"  - {dep}\n")
            out.write("\nDEV DEPENDENCIES:\n")
            for dep in pkg_info.get('devDependencies', []):
                out.write(f"  - {dep}\n")
            out.write("\nNPM SCRIPTS:\n")
            for script_name, cmd in pkg_info.get('scripts', {}).items():
                out.write(f"  - npm run {script_name} => {cmd}\n")
            out.write("\n")

        if app_routes:
            out.write(f"DAFTAR RUTE HALAMAN AKTIF ({len(app_routes)} Rute Terdeteksi):\n")
            for r in app_routes:
                out.write(f"  - {r}\n")
            out.write("\n\n")

        # BAGIAN 2: STRUKTUR POHON DIREKTORI
        out.write("=" * 80 + "\n")
        out.write("BAGIAN 2: STRUKTUR POHON DIREKTORI REPOSITORI\n")
        out.write("=" * 80 + "\n")
        out.write(f"📁 {os.path.basename(root_dir)}\n")
        out.write(ascii_tree)
        out.write("\n\n")

        # BAGIAN 3: KONTEN KODE SUMBER LENGKAP
        out.write("=" * 80 + "\n")
        out.write("BAGIAN 3: KODE SUMBER BERKAS REPOSITORI LENGKAP\n")
        out.write("=" * 80 + "\n\n")

        for idx, rel_path in enumerate(collected_files, 1):
            full_path = os.path.join(root_dir, rel_path)
            file_size = os.path.getsize(full_path)
            ext = os.path.splitext(rel_path)[1].lower() or '.txt'

            out.write("=" * 80 + "\n")
            out.write(f"FILE [{idx}/{total_files}]: {rel_path.replace(os.sep, '/')}\n")
            out.write(f"SIZE: {file_size:,} bytes | EXT: {ext}\n")
            out.write("=" * 80 + "\n")

            if file_size > MAX_FILE_SIZE_BYTES:
                out.write(f"[PERINGATAN: File berukuran {file_size / 1024:.1f} KB melebihi batas {MAX_FILE_SIZE_BYTES / 1024:.0f} KB. Isi file dilewati untuk efisiensi context window AI.]\n\n")
                continue

            try:
                with open(full_path, 'r', encoding='utf-8', errors='replace') as infile:
                    content = infile.read()

                if os.path.basename(rel_path).startswith('.env'):
                    content = mask_env_content(content)

                out.write(content)
                if not content.endswith('\n'):
                    out.write('\n')
                out.write("\n")

                total_lines_written += len(content.splitlines())
            except Exception as e:
                out.write(f"[ERROR membaca berkas {rel_path}: {str(e)}]\n\n")

            if idx % 25 == 0 or idx == total_files:
                print(f"  -> Diproses: {idx}/{total_files} berkas...")

    elapsed = time.time() - start_time
    output_size_mb = os.path.getsize(output_path) / (1024 * 1024)

    print("=" * 70)
    print("🎉 GENERASI KONTEKS REPOSITORI FRONTEND BERHASIL!")
    print("=" * 70)
    print(f"📄 File Output   : {output_path}")
    print(f"📊 Total Berkas  : {total_files} berkas")
    print(f"📝 Total Baris   : ~{total_lines_written:,} baris kode")
    print(f"💾 Ukuran Berkas : {output_size_mb:.2f} MB")
    print(f"⏱️ Waktu Eksekusi: {elapsed:.2f} detik")
    print("=" * 70)
    print("💡 TIPS UNTUK MENGGUNAKAN FILE INI:")
    print("1. Anda dapat meng-upload file txt ini ke ChatGPT Plus, Claude, atau Google AI Studio.")
    print("2. Tanyakan apa pun tentang frontend SIKDA, seperti:")
    print("   - 'Jelaskan alur data dari antrian dokter sampai ke resep obat di rawat jalan.'")
    print("   - 'Bagaimana cara menambahkan kolom baru pada formulir skrining perawat?'")
    print("   - 'Bantu saya merefaktor komponen TabPlan.tsx agar lebih modular.'")
    print("=" * 70)


if __name__ == '__main__':
    main()

