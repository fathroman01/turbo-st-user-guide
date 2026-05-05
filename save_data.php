<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Nama file penyimpanan data
$dataFile = 'data.json';

// Handle pre-flight request (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Hanya izinkan metode POST untuk menyimpan
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Ambil data JSON dari body request
    $json = file_get_contents('php://input');
    
    if ($json) {
        // Validasi JSON (opsional tapi disarankan)
        $data = json_decode($json);
        if ($data === null) {
            echo json_encode(['status' => 'error', 'message' => 'Format JSON tidak valid']);
            http_response_code(400);
            exit;
        }

        // Simpan ke file data.json
        if (file_put_contents($dataFile, $json)) {
            echo json_encode(['status' => 'success', 'message' => 'Data berhasil disimpan']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Gagal menulis ke file. Periksa izin folder (permissions)']);
            http_response_code(500);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Tidak ada data yang diterima']);
        http_response_code(400);
    }
    exit;
}

// Metode GET untuk membaca data (opsional, bisa langsung akses data.json)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFile)) {
        echo file_get_contents($dataFile);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'File data tidak ditemukan']);
        http_response_code(404);
    }
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Metode tidak diizinkan']);
?>
