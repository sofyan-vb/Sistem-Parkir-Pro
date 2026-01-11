<?php
abstract class Kendaraan {
    public $plat;
    public $jenis;
    public $waktuMasuk;

    public function __construct($plat, $jenis) {
        $this->plat = $plat;
        $this->jenis = $jenis;
        $this->waktuMasuk = time(); 
    }

    abstract public function hitungBiaya($jam);
}

class Mobil extends Kendaraan {
    public function hitungBiaya($jam) {
        return $jam * 5000;
    }
}

class Motor extends Kendaraan {
    public function hitungBiaya($jam) {
        return $jam * 2000;
    }
}
?>