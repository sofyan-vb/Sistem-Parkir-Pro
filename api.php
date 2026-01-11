<?php
session_start();
header('Content-Type: application/json');
require_once 'classes.php';

// Terima data JSON dari JavaScript
$input = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['act']) ? $_GET['act'] : $input['act'];

$response = ['status' => 'error', 'pesan' => 'Aksi tidak dikenal'];

// --- 1. LIST DATA ---
if ($action == 'list') {
    $data = [];
    if (isset($_SESSION['parkir'])) {
        foreach ($_SESSION['parkir'] as $plat => $objStr) {
            $obj = unserialize($objStr);
            $data[] = [
                'plat'  => $obj->plat,
                'jenis' => $obj->jenis,
                'jam'   => date("H:i:s", $obj->waktuMasuk)
            ];
        }
    }
    echo json_encode($data);
    exit;
}

// --- 2. MASUK ---
if ($action == 'masuk') {
    $plat  = strtoupper($input['plat']);
    $jenis = $input['jenis'];

    if (empty($plat)) {
        echo json_encode(['status' => 'error', 'pesan' => 'Plat wajib diisi']);
        exit;
    }

    // OOP Factory
    $kendaraan = ($jenis == 'Mobil') ? new Mobil($plat, 'Mobil') : new Motor($plat, 'Motor');
    
    $_SESSION['parkir'][$plat] = serialize($kendaraan);
    echo json_encode(['status' => 'success', 'pesan' => 'Berhasil masuk']);
    exit;
}

// --- 3. KELUAR ---
if ($action == 'keluar') {
    $plat = $input['plat'];
    
    if (isset($_SESSION['parkir'][$plat])) {
        $obj = unserialize($_SESSION['parkir'][$plat]);
        
        // Simulasi durasi (1-5 jam)
        $durasi = rand(1, 5);
        $total  = $obj->hitungBiaya($durasi); // Panggil method OOP

        unset($_SESSION['parkir'][$plat]); // Hapus data

        echo json_encode([
            'status' => 'success',
            'struk'  => [
                'plat'   => $obj->plat,
                'jenis'  => $obj->jenis,
                'durasi' => $durasi,
                'total'  => number_format($total, 0, ',', '.')
            ]
        ]);
    }
    exit;
}
?>