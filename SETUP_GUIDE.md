# DFSG - Detaylı Kurulum Kılavuzu

Bu kılavuz, sistemin tüm bileşenlerini hatasız bir şekilde ayağa kaldırmanız için gereken teknik adımları içerir.

## Sistem Mimarisi

Sistem aşağıdaki portlar üzerinden haberleşen dört ana parçadan oluşur:

- **Frontend (React + Vite):** Port 5173
- **Backend (Spring Boot):** Port 8080
- **AI Engine (FastAPI):** Port 8001
- **Veritabanı (PostgreSQL - Docker):** Port 5432

---

## Ön Gereksinimler

Kuruluma başlamadan önce bilgisayarınızda aşağıdaki araçların yüklü olduğundan emin olun:

- **Java 21:** `java -version`
- **Node.js & npm:** `node -v` ve `npm -v`
- **Python 3.10+:** `python3 --version`
- **Docker & Docker Desktop:** Veritabanını çalıştırmak için gereklidir.

---

## Kurulum ve Başlatma

### 1. Adım: Veritabanı Kurulumu (Docker)
Docker Desktop uygulamasını açın. Proje ana dizininde bir terminal açarak şu komutu çalıştırın:
```bash
docker compose up -d
```
Veritabanı hazır hale gelecektir. Bilgiler: DB Name: `dfsg_db`, User/Pass: `postgres/postgres`.

### 2. Adım: Backend Kurulumu (Spring Boot)
Yeni bir terminalde backend dizinine girin ve uygulamayı başlatın:
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```
Java sunucusu http://localhost:8080 üzerinde çalışmaya başlayacaktır. Veritabanı tabloları otomatik olarak oluşturulur.

### 3. Adım: AI Engine Kurulumu (FastAPI)
Ayrı bir terminalde ai-engine dizinine girin, sanal ortamı oluşturun ve servisleri başlatın:
```bash
cd ai-engine
python3 -m venv venv
source venv/bin/activate  # Windows için: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
AI servisi http://localhost:8001 üzerinde aktif olacaktır. İlk açılışta XTTSv2 modelini (~2GB) indirecektir.

### 4. Adım: Frontend Kurulumu (React + Vite)
Son terminal penceresinde frontend dizinine girin ve arayüzü başlatın:
```bash
cd frontend
npm install
npm run dev
```
Kullanıcı arayüzüne http://localhost:5173 üzerinden erişebilirsiniz.

---

## Yapılandırma Detayları

### Backend Ayarları
`backend/src/main/resources/application.properties` dosyası üzerinden şu ayarlar kontrol edilebilir:
- Veritabanı bağlantı adresi
- JWT Gizli Anahtarı
- CORS (Frontend erişim izinleri)

### Frontend Ayarları
React uygulamasındaki API çağrıları `http://localhost:8080` adresindeki backend servisine yönlendirilmiştir.

---

## Sorun Giderme

### Port Hatası (Port already in use)
Eğer 8080, 8001 veya 5173 portları doluysa, çalışan eski süreçleri kapatmanız gerekir:
```bash
lsof -i :8080  # Backend sürecini bulur
kill -9 <PID>  # Süreci sonlandırır
```

### Model İndirme Sorunu (AI Engine)
XTTSv2 modeli yaklaşık 2GB boyutundadır. İndirme sırasında internet bağlantınızın kesilmemesine ve diskte yeterli alan (en az 4GB) olduğundan emin olun.

---

## Hızlı Başlatma Komut Özetleri

```bash
# Terminal 1: Veritabanı
docker compose up -d

# Terminal 2: Java (Backend)
cd backend && ./mvnw spring-boot:run

# Terminal 3: Python (AI Engine)
cd ai-engine && source venv/bin/activate && python main.py

# Terminal 4: React (Frontend)
cd frontend && npm run dev
```
