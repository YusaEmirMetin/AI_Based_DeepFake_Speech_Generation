# Yapay Zeka Tabanlı Derin Sahte Ses Üretimi (DFSG)

Bu proje, orijinal bir derin sahte (DeepFake) ses üretim scriptinin modern, çok katmanlı ve kurumsal düzeyde bir web uygulamasına dönüştürülmüş halidir. Kullanıcılar metin girdileri sağlayarak ve kısa bir ses örneği yükleyerek, XTTSv2 modelinin gücüyle saniyeler içinde ses klonlaması yapabilirler.

## Sistem Mimarisi

Uygulama, Agile (Çevik) yazılım geliştirme prensiplerine uygun olarak dört ana sprint aşamasında geliştirilmiştir:

- **Frontend:** ReactJS ve Vite kullanılarak modern, karanlık tema (Dark/Neon) odaklı bir arayüz inşa edilmiştir.
- **Backend:** Java 21 ve Spring Boot 3.x ile kullanıcı yönetimi, JWT tabanlı güvenlik ve veritabanı entegrasyonu sağlanmıştır.
- **AI Engine:** Python FastAPI mikroservisi, XTTSv2 modelini kullanarak asenkron ses sentezleme ve klonlama işlemlerini yürütür.
- **Veritabanı:** PostgreSQL, kullanıcı verilerini ve üretim günlüklerini saklamak için Docker üzerinde koşturulmaktadır.

## Temel Özellikler

- **Ses Klonlama:** Sadece 3-5 saniyelik bir referans .wav dosyası ile hedef metni o sesle seslendirme.
- **Güvenli Kimlik Doğrulama:** JWT (JSON Web Token) tabanlı giriş ve kayıt sistemi.
- **Görsel Analiz:** Ses üretimi sırasında dinamik Mel-Spektrogram dalga boyu görselleştirmesi.
- **Üretim Geçmişi:** Kullanıcıların daha önce ürettiği sesleri listeleyebileceği ve tekrar dinleyebileceği geçmiş modülü.
- **Profil Yönetimi:** Kullanıcı istatistiklerini ve bilgilerini içeren profil sekmesi.

## Kurulum ve Çalıştırma

Sistemi tam fonksiyonel olarak çalıştırmak için aşağıdaki üç bileşenin de aktif olması gerekmektedir:

### 1. Veritabanı ve Altyapı
Docker Desktop yüklü olmalıdır. Proje kök dizininde aşağıdaki komutu çalıştırarak PostgreSQL veritabanını ayağa kaldırın:
```bash
docker compose up -d
```

### 2. Backend (Spring Boot)
Backend dizinine girin ve Maven wrapper üzerinden uygulamayı başlatın:
```bash
cd backend
./mvnw spring-boot:run
```
Servis varsayılan olarak http://localhost:8080 portunda çalışacaktır.

### 3. AI Engine (FastAPI)
Python ortamını hazırlayın ve mikroservisi başlatın:
```bash
cd ai-engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```
Servis http://localhost:8001 portunda çalışacaktır. (Not: İlk çalıştırmada model dosyaları indirileceği için bir süre bekletebilir.)

### 4. Frontend (React)
Arayüzü başlatmak için frontend dizinine girin:
```bash
cd frontend
npm install
npm run dev
```
Uygulamaya tarayıcınızdan http://localhost:5173 üzerinden erişebilirsiniz.

## Teknolojik Araçlar

- **Backend:** Spring Boot, Spring Security, JPA, JWT, Maven.
- **Frontend:** ReactJS, Vite, Vanilla CSS, Web Audio API (Canvas visualization).
- **AI:** Python, FastAPI, Coqui XTTSv2, PyTorch.
- **Veri:** PostgreSQL, Docker.

---

Bu proje eğitim ve araştırma amaçlı geliştirilmiştir. Derin sahte ses teknolojilerinin etik kullanım kurallarına uygun olarak kullanılması tavsiye edilir.
