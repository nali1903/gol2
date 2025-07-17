# Oyver - Sunucu ve Yayıncı Listeleme Platformu

Oyver, Metin2 sunucularını ve yayıncılarını listeleyen, kullanıcıların oy kullanmasına ve yorum yapmasına olanak tanıyan modern bir web platformudur.

## İçindekiler

- [Proje Yapısı](#proje-yapısı)
- [Veritabanı Şeması](#veritabanı-şeması)
  - [Admin](#admin)
  - [AdminSession](#adminsession)
  - [Ad (Reklam)](#ad-reklam)
  - [SideAd (Köşe Reklamı)](#sidead-köşe-reklamı)
  - [Blog](#blog)
  - [BlogComment](#blogcomment)
  - [Contact](#contact)
  - [ProfileComment](#profilecomment)
  - [Server](#server)
  - [ServerComment](#servercomment)
  - [Streamer](#streamer)
  - [StreamerVote](#streamervote)
  - [Visitor](#visitor)
  - [Vote](#vote)
- [API Endpoints](#api-endpoints)
  - [Admin API](#admin-api)
  - [Public API](#public-api)
- [Kurulum](#kurulum)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Son Güncellemeler](#son-güncellemeler)
- [API Güvenlik Sistemi](#api-güvenlik-sistemi)
  - [Server Token Doğrulama](#server-token-doğrulama)
  - [Admin Giriş Kontrolü](#admin-giriş-kontrolü)

## Proje Yapısı

Proje, Next.js tabanlı olup modern bir klasör yapısı kullanmaktadır.

```
/
├── backend/                # Arka uç kodları (MongoDB modelleri, middleware)
│   ├── config/             # Veritabanı bağlantı konfigürasyonu
│   ├── middleware/         # API middleware'leri (auth, security, rate limit)
│   ├── models/             # Mongoose veritabanı modelleri (şemalar)
│   └── ...
├── components/             # React bileşenleri
│   ├── admin/              # Admin paneli özel bileşenleri
│   │   ├── common/         # Admin ortak bileşenleri
│   │   ├── layout/         # Admin düzen bileşenleri
│   │   ├── servers/        # Sunucu yönetimi bileşenleri
│   │   │   ├── EditServerModal.tsx  # Sunucu düzenleme modalı
│   │   │   └── ServerListPage.tsx   # Sunucu listesi sayfası
│   │   ├── settings/       # Admin ayarlar bileşenleri
│   │   │   ├── AdFormModal.tsx     # Reklam ekleme/düzenleme modalı
│   │   │   ├── AdsSettings.tsx     # Reklam ayarları bileşeni
│   │   │   ├── SideAdFormModal.tsx # Köşe reklamı ekleme/düzenleme modalı
│   │   │   └── SideAdsSettings.tsx # Köşe reklam ayarları bileşeni
│   │   │   └── VisitorsSettings.tsx # Ziyaretçi ayarları bileşeni
│   │   ├── comments/       # Yorum yönetimi bileşenleri
│   │   ├── streamers/      # Yayıncı yönetimi bileşenleri
│   │   ├── AdminLayout.tsx # Admin panel düzeni
│   │   └── AdminSidebar.tsx# Admin kenar çubuğu
│   ├── blog/               # Blog bileşenleri
│   ├── forms/              # Form bileşenleri
│   ├── profile/            # Profil bileşenleri
│   ├── server/             # Sunucu bileşenleri
│   ├── ui/                 # Düşük seviyeli UI bileşenleri (shadcn/ui)
│   └── ...
├── contexts/               # React Context API dosyaları
│   ├── AdminContext.tsx    # Admin kimlik doğrulama bağlamı
│   ├── LanguageContext.tsx # Dil yönetimi bağlamı
│   └── UserContext.tsx     # Kullanıcı bağlamı
├── hooks/                  # Özel React hook'ları
│   └── ...
├── i18n/                   # Uluslararasılaştırma (i18n) dosyaları
│   └── locales/            # Çeviri dosyaları (en.json, tr.json)
├── pages/                  # Next.js sayfaları
│   ├── api/                # API endpoint'leri
│   │   ├── admin/          # Admin API endpoint'leri
│   │   │   ├── ads/            # Reklam yönetimi API'leri
│   │   │   │   ├── [id].ts     # Reklam detay/düzenleme/silme API'si
│   │   │   │   └── index.ts    # Reklam listeleme/ekleme API'si
│   │   │   ├── streamers/      # Yayıncı yönetimi API'leri
│   │   │   └── ...             # Diğer admin API'leri
│   │   ├── ads/                # Reklam API'leri
│   │   │   ├── [id].ts         # Reklam detay API'si
│   │   │   ├── index.ts        # Reklam listeleme API'si
│   │   │   └── seed.ts         # Örnek reklam oluşturma API'si
│   │   └── ...                 # Diğer API'ler
│   └── ...                     # Diğer frontend sayfaları
├── public/                 # Statik dosyalar (görseller, fontlar)
│   └── uploads/            # Yüklenen dosyaların saklandığı klasör
├── styles/                 # CSS ve stil dosyaları (Tailwind CSS)
├── utils/                  # Yardımcı fonksiyonlar ve modüller
│   └── ...
├── .env                        # Ortam değişkenleri
├── next.config.js              # Next.js yapılandırması
├── package.json                # Paket bağımlılıkları ve scriptler
├── tailwind.config.js          # Tailwind CSS yapılandırması
└── tsconfig.json               # TypeScript yapılandırması
├── types/                  # TypeScript tip tanımlamaları
│   ├── index.ts            # Genel tipler
│   ├── serverTypes.ts      # Sunucu ile ilgili tipler ve yardımcı fonksiyonlar
│   ├── formidable.d.ts     # Formidable için tip tanımlamaları
│   └── react-quill.d.ts    # React Quill için tip tanımlamaları
```

## Veritabanı Şeması

Projede kullanılan ana MongoDB modelleri ve şemaları aşağıda listelenmiştir.

### Admin
`backend/models/Admin.ts`
Süper admin ve normal admin rollerini yönetir. Admin paneline erişimi kontrol eder.

| Alan       | Tip      | Açıklama                                   |
|------------|----------|--------------------------------------------|
| `username` | String   | Admin kullanıcı adı (benzersiz)            |
| `password` | String   | Hash'lenmiş admin şifresi                  |
| `email`    | String   | Admin e-posta adresi (benzersiz)           |
| `fullName` | String   | Admin tam adı                              |
| `role`     | Enum     | 'admin' veya 'superadmin'                  |
| `isActive` | Boolean  | Admin hesabının aktif olup olmadığı        |
| `lastLogin`| Date     | Son giriş tarihi                           |

### AdminSession
`backend/models/AdminSession.ts`
Aktif admin oturumlarını takip eder.

| Alan         | Tip                | Açıklama                               |
|--------------|--------------------|----------------------------------------|
| `adminId`    | ObjectId           | İlişkili admin kullanıcısının ID'si    |
| `token`      | String             | Oturum JWT token'ı (benzersiz)         |
| `ip`         | String             | Oturumun başladığı IP adresi           |
| `userAgent`  | String             | Kullanıcı aracı bilgisi                |
| `isActive`   | Boolean            | Oturumun aktif olup olmadığı           |
| `expiresAt`  | Date               | Oturumun sona erme tarihi              |
| `lastActivity`| Date              | Son aktivite tarihi                    |

### Ad (Reklam)
`backend/models/Ad.ts`
Ana sayfa ve diğer genel reklamlarda gösterilen reklamları yönetir.

| Alan       | Tip      | Açıklama                                   |
|------------|----------|--------------------------------------------|
| `title`    | String   | Reklam başlığı                             |
| `imageUrl` | String   | Reklam görseli URL'si                      |
| `linkUrl`  | String   | Reklam bağlantı URL'si                     |
| `isActive` | Boolean  | Reklam aktif mi?                           |
| `priority` | Number   | Reklamın gösterim önceliği (daha yüksek sayı, daha yüksek öncelik) |
| `startDate`| Date     | Reklamın yayınlanmaya başladığı tarih       |
| `endDate`  | Date     | Reklamın yayınlanmasının bittiği tarih      |
| `clickCount`| Number  | Reklama tıklanma sayısı                    |
| `viewCount`| Number   | Reklamın görüntülenme sayısı               |

### SideAd (Köşe Reklamı)
`backend/models/SideAd.ts`
Web sitesinin sağında veya solunda gösterilen köşe reklamlarını yönetir.

| Alan       | Tip      | Açıklama                                   |
|------------|----------|--------------------------------------------|
| `position` | Enum     | Reklamın konumu ('left' veya 'right')      |
| `title`    | String   | Reklam başlığı                             |
| `imageUrl` | String   | Reklam görseli URL'si                      |
| `linkUrl`  | String   | Reklam bağlantı URL'si                     |
| `isActive` | Boolean  | Reklam aktif mi?                           |
| `startDate`| Date     | Reklamın yayınlanmaya başladığı tarih       |
| `endDate`  | Date     | Reklamın yayınlanmasının bittiği tarih      |
| `views`    | Number   | Reklamın görüntülenme sayısı               |
| `clicks`   | Number   | Reklama tıklanma sayısı                    |

### Blog
`backend/models/Blog.ts`
Blog yazılarını yönetir.

| Alan            | Tip      | Açıklama                                   |
|-----------------|----------|--------------------------------------------|
| `title`         | String   | Blog yazısı başlığı (benzersiz)            |
| `slug`          | String   | SEO dostu URL için slug (benzersiz)        |
| `content`       | String   | Blog yazısının içeriği (HTML/Markdown)     |
| `excerpt`       | String   | Yazının kısa özeti                         |
| `featuredImage` | String   | Öne çıkan görselin URL'si                  |
| `image`         | String   | Ana görselin URL'si                        |
| `publishDate`   | Date     | Yazının yayınlanma tarihi                  |
| `author`        | String   | Yazının yazarı                             |
| `category`      | Enum     | Blog kategorisi ('news', 'guides', 'updates', 'events') |
| `tags`          | [String] | Etiketler dizisi                           |
| `readTime`      | Number   | Tahmini okuma süresi (dakika)              |
| `likes`         | Number   | Beğeni sayısı                              |
| `views`         | Number   | Görüntülenme sayısı                        |
| `comments`      | [Subdocument] | Yorumlar dizisi (BlogComment subdocument) |
| `isPublished`   | Boolean  | Yazının yayınlanıp yayınlanmadığı          |
| `metaTitle`     | String   | SEO meta başlığı                           |
| `metaDescription`| String  | SEO meta açıklaması                        |
| `metaKeywords`  | String   | SEO anahtar kelimeler                      |
| `likeLog`       | [Object] | Oy veren IP'ler ve tarihler                |
| `viewLog`       | [Object] | Görüntüleyen IP'ler ve tarihler            |

### BlogComment
`backend/models/Blog.ts` (Blog modeli içinde Subdocument olarak)
Blog yazıları için yapılan yorumları temsil eder.

| Alan        | Tip      | Açıklama                                   |
|-------------|----------|--------------------------------------------|
| `author`    | String   | Yorumu yapanın adı                         |
| `content`   | String   | Yorum içeriği                              |
| `date`      | Date     | Yorumun yapıldığı tarih                    |
| `status`    | Enum     | Yorumun durumu ('pending', 'approved', 'rejected') |
| `ip`        | String   | Yorumu yapanın IP adresi                   |
| `userAgent` | String   | Yorumu yapanın kullanıcı aracı bilgisi     |

### Contact
`backend/models/Contact.ts`
İletişim formu mesajlarını yönetir.

| Alan       | Tip      | Açıklama                                   |
|------------|----------|--------------------------------------------|
| `name`     | String   | Gönderenin adı                             |
| `email`    | String   | Gönderenin e-posta adresi                  |
| `subject`  | String   | Mesaj konusu                               |
| `message`  | String   | Mesaj içeriği                              |
| `isRead`   | Boolean  | Mesajın okunup okunmadığı                  |
| `ip`       | String   | Mesajı gönderenin IP adresi                |

### ProfileComment
`backend/models/ProfileComment.ts`
Kullanıcı profillerine yapılan yorumları yönetir.

| Alan        | Tip      | Açıklama                                   |
|-------------|----------|--------------------------------------------|
| `userId`    | ObjectId | Yorum yapılan kullanıcının ID'si           |
| `author`    | String   | Yorumu yapanın adı                         |
| `content`   | String   | Yorum içeriği                              |
| `date`      | Date     | Yorumun yapıldığı tarih                    |
| `status`    | Enum     | Yorumun durumu ('pending', 'approved', 'rejected') |
| `ip`        | String   | Yorumu yapanın IP adresi                   |
| `userAgent` | String   | Yorumu yapanın kullanıcı aracı bilgisi     |

### Server
`backend/models/Server.ts`
Metin2 sunucularını ve özelliklerini yönetir.

| Alan               | Tip       | Açıklama                                   |
|--------------------|-----------|--------------------------------------------|
| `name`             | String    | Sunucu adı (benzersiz)                     |
| `description`      | String    | Sunucu açıklaması                          |
| `category`         | String    | Sunucu kategorisi (örn: "1-99", "hardemek")|
| `categories`       | [String]  | Birden fazla kategori (çoklu seçim)        |
| `logo`             | String    | Sunucu logosu URL'si                       |
| `images`           | [String]  | Sunucu görsel galerisi URL'leri            |
| `websiteUrl`       | String    | Sunucunun web sitesi URL'si                |
| `discordUrl`       | String    | Sunucunun Discord davet URL'si             |
| `personalDiscord`  | String    | Sunucu sahibinin Discord kullanıcı adı     |
| `ownerName`        | String    | Sunucu sahibinin adı                       |
| `status`           | Enum      | Admin onayı durumu ('pending', 'approved', 'rejected') |
| `serverStatus`     | Enum      | Sunucunun anlık durumu ('online', 'coming-soon', 'inactive') |
| `votes`            | Number    | Toplam oy sayısı                           |
| `rating`           | Number    | Genel derecelendirme (ortak puan)          |
| `releaseDate`      | Date      | Sunucunun açılış tarihi                    |
| `promotionInterest`| String    | Tanıtım ilgisi (örn: 'high', 'medium')    |
| `legalSales`       | Boolean   | Yasal satış yapıyor mu?                   |
| `legalSalesUrl`    | String    | Yasal satış sitesi URL'si                  |
| `itemMarketActive` | Boolean   | Eşya pazarı aktif mi?                      |
| `itemMarketPrice`  | String    | Eşya pazarı fiyatlandırması                |
| `contentCreators`  | [Object]  | İçerik üreticileri (name, platform, url)   |
| `antiCheat`        | String    | Anticheat yazılımı                         |
| `customAntiCheat`  | String    | Özel anticheat açıklaması                  |
| `legalActivity`    | Enum      | Hukuki aktivite seviyesi ('low', 'medium', 'high') |
| `marketActivity`   | Number    | Pazar aktivitesi (1-100)                   |
| `playerCount`      | Number    | Ortalama oyuncu sayısı (yaklaşık)          |
| `hasVideo`         | Boolean   | Tanıtım videosu var mı?                    |
| `videoUrl`         | String    | Tanıtım videosu URL'si                     |
| `comments`         | [Subdocument] | Yorumlar dizisi (ServerComment subdocument) |
| `creatorIpAddress` | String    | Sunucuyu ekleyen kişinin IP adresi         |
| `trend`            | Enum      | Popülerlik trendi ('up', 'down', 'stable') |

### ServerComment
`backend/models/Server.ts` (Server modeli içinde Subdocument olarak)
Sunucu sayfaları için yapılan yorumları temsil eder.

| Alan        | Tip      | Açıklama                                   |
|-------------|----------|--------------------------------------------|
| `author`    | String   | Yorumu yapanın adı                         |
| `content`   | String   | Yorum içeriği                              |
| `date`      | Date     | Yorumun yapıldığı tarih                    |
| `isApproved`| Boolean  | Yorumun onaylı olup olmadığı               |
| `ip`        | String   | Yorumu yapanın IP adresi                   |
| `userAgent` | String   | Yorumu yapanın kullanıcı aracı bilgisi     |
| `likes`     | Number   | Yorumun beğeni sayısı                      |

### Streamer
`backend/models/Streamer.ts`
Yayıncıları ve özelliklerini yönetir.

| Alan          | Tip      | Açıklama                                   |
|---------------|----------|--------------------------------------------|
| `name`        | String   | Yayıncı adı                                |
| `avatar`      | String   | Profil fotoğrafı URL'si                    |
| `platforms`   | [Enum]   | Yayın yaptığı platformlar ('youtube', 'twitch', 'kick', 'tiktok') |
| `channelUrls` | Object   | Platformlara göre kanal URL'leri           |
| `hiringStatus`| Enum     | İş alım durumu ('active', 'inactive', 'unknown') |
| `price`       | Enum     | Fiyatlandırma seviyesi ('cheap', 'medium', 'expensive') |
| `recognition` | Number   | Tanınırlık oranı (0-100)                   |
| `gameImpact`  | Number   | Oyuna etki oranı (0-100)                   |
| `votes`       | Number   | Toplam oy sayısı                           |
| `voters`      | [String] | Oy veren IP adresleri                      |
| `createdBy`   | String   | Yayıncıyı ekleyen kişinin IP adresi        |
| `status`      | Enum     | Yayıncı durumu ('pending', 'approved', 'rejected') |
| `approvedBy`  | String   | Onaylayan adminin ID'si                    |
| `approvedAt`  | Date     | Onaylanma tarihi                           |

### StreamerVote
`backend/models/StreamerVote.ts`
Yayıncı oylama bilgilerini takip eder.

| Alan         | Tip      | Açıklama                                   |
|--------------|----------|--------------------------------------------|
| `ip`         | String   | Oy verenin IP adresi                       |
| `streamerId` | ObjectId | Oy verilen yayıncının ID'si                |
| `votedAt`    | Date     | Oy verme tarihi                            |
| `voteData`   | Object   | Oylama verileri (recognition, gameImpact)  |

### Visitor
`backend/models/Visitor.ts`
Web sitesi ziyaretçi istatistiklerini takip eder.

| Alan           | Tip      | Açıklama                                   |
|----------------|----------|--------------------------------------------|
| `date`         | Date     | İstatistiğin ait olduğu tarih (günlük)     |
| `dailyVisitors`| Number   | Günlük toplam ziyaretçi sayısı             |
| `onlineUsers`  | Number   | Anlık çevrimiçi kullanıcı sayısı           |
| `peakOnlineUsers`| Number | Günün en yüksek çevrimiçi kullanıcı sayısı |
| `uniqueVisitors`| Number  | Benzersiz ziyaretçi sayısı (IP bazlı)      |
| `visitedIps`   | [String] | Ziyaret eden IP'leri kaydeden dizi         |

### Vote
`backend/models/Vote.ts`
Sunucu oylama bilgilerini takip eder.

| Alan         | Tip      | Açıklama                                   |
|--------------|----------|--------------------------------------------|
| `ip`         | String   | Oy verenin IP adresi                       |
| `serverId`   | ObjectId | Oy verilen sunucunun ID'si                 |
| `votedAt`    | Date     | Oy verme tarihi                            |
| `voteData`   | Object   | Oylama verileri (legalActivity, itemMarket, marketActivity, playerCount) |

## API Endpoints

Proje, hem genel kullanıcılar hem de admin paneli için RESTful API endpoint'leri sunar.

### Admin API
`/api/admin/*` altındaki tüm endpoint'ler admin yetkilendirmesi gerektirir.

-   **Auth**
    -   `POST /api/admin/auth/login`: Admin girişi.
    -   `POST /api/admin/auth/logout`: Admin çıkışı.
    -   `GET /api/admin/auth/me`: Giriş yapmış adminin bilgilerini getirir.
    -   `POST /api/admin/seed-admin`: İlk admin kullanıcısını oluşturur (sadece development/özel anahtar ile).

-   **Ads (Genel Reklamlar)**
    -   `GET /api/admin/ads`: Tüm reklamları listeler (filtreleme ve sıralama destekli).
    -   `POST /api/admin/ads`: Yeni reklam ekler.
    -   `POST /api/admin/ads/upload`: Reklam görseli yükler.
    -   `GET /api/admin/ads/[id]`: Belirli bir reklamın detaylarını getirir.
    -   `PUT /api/admin/ads/[id]`: Belirli bir reklamı günceller.
    -   `DELETE /api/admin/ads/[id]`: Belirli bir reklamı siler.

-   **Side Ads (Köşe Reklamları)**
    -   `GET /api/admin/side-ads`: Tüm köşe reklamlarını listeler.
    -   `POST /api/admin/side-ads`: Yeni köşe reklamı ekler.
    -   `POST /api/admin/side-ads/upload`: Köşe reklam görseli yükler.
    -   `GET /api/admin/side-ads/[id]`: Belirli bir köşe reklamının detaylarını getirir.
    -   `PUT /api/admin/side-ads/[id]`: Belirli bir köşe reklamını günceller.
    -   `DELETE /api/admin/side-ads/[id]`: Belirli bir köşe reklamını siler.

-   **Blog**
    -   `GET /api/admin/blog`: Tüm blog yazılarını listeler (filtreleme ve sayfalama).
    -   `POST /api/admin/blog`: Yeni blog yazısı oluşturur.
    -   `GET /api/admin/blog/[id]`: Belirli bir blog yazısını getirir.
    -   `PUT /api/admin/blog/[id]`: Belirli bir blog yazısını günceller.
    -   `DELETE /api/admin/blog/[id]`: Belirli bir blog yazısını siler.
    -   `POST /api/admin/blog/upload`: Blog görsellerini yükler.
    -   `GET /api/admin/blog/comments`: Tüm blog yorumlarını listeler (status ve arama filtreli).
    -   `GET /api/admin/blog/comments/pending?count=true`: Onay bekleyen blog yorumlarının sayısını getirir.
    -   `GET /api/admin/blog/comments/pending`: Onay bekleyen blog yorumlarını listeler.
    -   `POST /api/admin/blog/comments/approve`: Blog yorumunun durumunu (onayla/reddet/sil) günceller.

-   **Contact**
    -   `GET /api/admin/contact`: Tüm iletişim mesajlarını listeler.
    -   `PUT /api/admin/contact`: İletişim mesajını günceller (örn: okundu olarak işaretleme).
    -   `DELETE /api/admin/contact`: İletişim mesajını siler.

-   **Comments (Genel Yorum Yönetimi)**
    -   `GET /api/admin/comments/blog`: Blog yorumlarını getirir.
    -   `GET /api/admin/comments/profile`: Profil yorumlarını getirir.
    -   `GET /api/admin/comments/server`: Sunucu yorumlarını getirir.

-   **Profile Comments (Profil Yorumları)**
    -   `GET /api/admin/profile/comments/pending?count=true`: Onay bekleyen profil yorumlarının sayısını getirir.
    -   `GET /api/admin/profile/comments/pending`: Onay bekleyen profil yorumlarını listeler.
    -   `POST /api/admin/profile/comments/approve`: Profil yorumunun durumunu (onayla/reddet) günceller.
    -   `POST /api/admin/migrate-comments`: Eski yorum şemasından yeni şemaya geçiş yapar.

-   **Server Comments (Sunucu Yorumları)**
    -   `GET /api/admin/server/comments/pending?count=true`: Onay bekleyen sunucu yorumlarının sayısını getirir.
    -   `GET /api/admin/server/comments/pending`: Onay bekleyen sunucu yorumlarını listeler.
    -   `POST /api/admin/server/comments/approve`: Sunucu yorumunun durumunu (onayla/reddet/sil) günceller.

-   **Servers**
    -   `GET /api/admin/servers`: Tüm sunucuları listeler (filtreleme, sıralama, sayfalama).
    -   `GET /api/admin/servers/pending?count=true`: Onay bekleyen sunucu sayısını getirir.
    -   `GET /api/admin/servers/pending`: Onay bekleyen sunucuları listeler.
    -   `PUT /api/admin/servers/[id]/status`: Sunucu durumunu günceller.
    -   `GET /api/admin/servers/[id]`: Belirli bir sunucunun detaylarını getirir.
    -   `PUT /api/admin/servers/[id]`: Belirli bir sunucuyu günceller (formidable ile).
    -   `DELETE /api/admin/servers/[id]`: Belirli bir sunucuyu siler.

-   **Streamers**
    -   `GET /api/admin/streamers`: Tüm yayıncıları listeler (filtreleme, sıralama, sayfalama).
    -   `POST /api/admin/streamers`: Yeni yayıncı ekler.
    -   `POST /api/admin/streamers/upload`: Yayıncı avatarı yükler.
    -   `GET /api/admin/streamers/pending?count=true`: Onay bekleyen yayıncı sayısını getirir.
    -   `GET /api/admin/streamers/pending`: Onay bekleyen yayıncıları listeler.
    -   `POST /api/admin/streamers/approve/[id]`: Yayıncıyı onaylar veya reddeder.
    -   `PUT /api/admin/streamers/[streamerId]`: Yayıncı bilgilerini günceller.
    -   `DELETE /api/admin/streamers/[streamerId]`: Yayıncıyı siler.

-   **Users**
    -   `GET /api/admin/users`: Tüm kullanıcıları listeler.
    -   `POST /api/admin/users`: Yeni admin/kullanıcı oluşturur.
    -   `GET /api/admin/users/[id]`: Belirli bir kullanıcıyı getirir.
    -   `PUT /api/admin/users/[id]`: Kullanıcı bilgilerini günceller.
    -   `DELETE /api/admin/users/[id]`: Kullanıcıyı siler.

-   **Visitors**
    -   `PUT /api/admin/visitors/update`: Ziyaretçi istatistiklerini manuel olarak günceller.

-   **Upload**
    -   `POST /api/admin/upload`: Genel dosya yükleme API'si (örn: blog için).

-   **Vote Stats**
    -   `GET /api/admin/vote-stats`: Genel oy istatistiklerini getirir.

### Public API
`/api/*` altındaki bu endpoint'ler genellikle kimlik doğrulama gerektirmez veya farklı bir doğrulama mekanizması kullanır.

-   **Ads**
    -   `GET /api/ads`: Aktif reklamları getirir.
    -   `POST /api/ads/seed`: Örnek reklam verisi oluşturur (sadece development).
    -   `GET /api/ads/[id]`: Belirli bir reklamın detaylarını getirir (view count artırır).

-   **Blog**
    -   `GET /api/blog`: Tüm yayınlanmış blog yazılarını listeler.
    -   `GET /api/blog/[slug]`: Belirli bir blog yazısının detaylarını getirir (view count artırır).

-   **Contact**
    -   `POST /api/contact`: İletişim formu mesajı gönderir.

-   **Homepage**
    -   `GET /api/homepage`: Ana sayfa için gerekli verileri (top sunucular, reklamlar vb.) getirir.

-   **Servers**
    -   `GET /api/servers`: Tüm onaylanmış sunucuları listeler (filtreleme, sıralama, sayfalama).
    -   `POST /api/servers`: Yeni sunucu ekler (admin onayı bekler).
    -   `GET /api/servers/comment`: Sunucuya yorum ekler.
    -   `GET /api/servers/stats`: Sunucu istatistiklerini getirir.
    -   `GET /api/servers/top`: En çok oylanan sunucuları getirir.
    -   `GET /api/servers/vote-status`: Kullanıcının belirli bir sunucuya oy verip veremeyeceğini kontrol eder.
    -   `POST /api/servers/vote`: Sunucuya oy verir.
    -   `GET /api/servers/[id]`: Belirli bir sunucunun detaylarını getirir (view count artırır).

-   **Side Ads**
    -   `GET /api/side-ads`: Aktif köşe reklamlarını getirir.
    -   `POST /api/side-ads/click`: Köşe reklam tıklama sayısını artırır.
    -   `POST /api/side-ads/view`: Köşe reklam görüntülenme sayısını artırır.

-   **Stats**
    -   `GET /api/stats`: Genel istatistikleri getirir.
    -   `GET /api/stats/visitors`: Günlük ziyaretçi istatistiklerini getirir.

-   **Streamers**
    -   `POST /api/streamers/add`: Yeni yayıncı ekler (admin onayı bekler).
    -   `GET /api/streamers`: Tüm onaylanmış yayıncıları listeler.
    -   `POST /api/streamers/vote`: Yayıncıya oy verir.
    -   `GET /api/streamers/votes`: Belirli bir yayıncının oy istatistiklerini getirir.

-   **Users**
    -   `GET /api/users/[userId]`: Belirli bir kullanıcının profil bilgilerini getirir.
    -   `GET /api/users/[userId]/comments`: Belirli bir kullanıcının yorumlarını listeler.
    -   `GET /api/users/[userId]/servers`: Belirli bir kullanıcının sunucularını listeler.

## Ortam Değişkenleri (.env)

Aşağıdaki çevre değişkenleri projenin çalışması için gereklidir:

### Development Ortamı (.env.local)
```
MONGODB_CONNECT="mongodb://localhost:27017/metin2servers"
ALLOWED_ORIGIN="http://localhost:5173"
NODE_ENV=development
JWT_SECRET=YOUR_RANDOM_JWT_SECRET_KEY
PORT=3000
API_KEY=YOUR_RANDOM_API_KEY
ADMIN_KEY=YOUR_RANDOM_ADMIN_KEY
NEXT_PUBLIC_API_KEY=YOUR_PUBLIC_API_KEY
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY
CLOUDFLARE_TURNSTILE_SECRET_KEY=YOUR_CLOUDFLARE_TURNSTILE_SECRET_KEY
SEED_API_KEY=YOUR_RANDOM_SEED_API_KEY
```

### Production Ortamı (.env.production.local)
```
MONGODB_CONNECT="mongodb://localhost:27017/metin2servers"
ALLOWED_ORIGIN="http://localhost:3000" # Canlı ortamda kendi domaininiz olmalı
NODE_ENV=production
JWT_SECRET=YOUR_RANDOM_JWT_SECRET_KEY
PORT=3000
API_KEY=YOUR_RANDOM_API_KEY
ADMIN_KEY=YOUR_RANDOM_ADMIN_KEY
NEXT_PUBLIC_API_KEY=YOUR_PUBLIC_API_KEY
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY
CLOUDFLARE_TURNSTILE_SECRET_KEY=YOUR_CLOUDFLARE_TURNSTILE_SECRET_KEY
SEED_API_KEY=YOUR_RANDOM_SEED_API_KEY
```

### Çevre Değişkenleri Açıklaması
-   `JWT_SECRET`: Admin paneli JWT token şifreleme anahtarı. **Üretim için kesinlikle güçlü ve benzersiz bir anahtar olmalıdır.**
-   `MONGODB_CONNECT`: MongoDB veritabanı bağlantı adresi.
-   `ALLOWED_ORIGIN`: İzin verilen origin adresi. Frontend uygulamanızın URL'si olmalıdır.
-   `NODE_ENV`: Uygulama ortamı (`development` veya `production`).
-   `PORT`: Server port numarası.
-   `API_KEY`: Genel API istekleri için güvenlik anahtarı.
-   `ADMIN_KEY`: Admin işlemleri için güvenlik anahtarı.
-   `NEXT_PUBLIC_API_KEY`: Frontend'de kullanılacak public API anahtarı (tarayıcıda erişilebilir).
-   `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`: Cloudflare Turnstile site anahtarı (frontend'de kullanılır).
-   `CLOUDFLARE_TURNSTILE_SECRET_KEY`: Cloudflare Turnstile gizli anahtarı (backend'de doğrulanır).
-   `SEED_API_KEY`: `seed-admin` API'sini üretim ortamında çalıştırmak için özel anahtar. **Üretimde kullanılmamalı veya çok dikkatli yönetilmelidir.**

## Kurulum

1.  Repo'yu klonlayın: `git clone [repo-url]`
2.  Proje dizinine gidin: `cd project3`
3.  Bağımlılıkları yükleyin: `npm install` veya `yarn install`
4.  `.env.local` ve `.env.production.local` dosyalarını yukarıdaki formatta kendi değerlerinizle oluşturun. **`JWT_SECRET`, `API_KEY`, `ADMIN_KEY`, `SEED_API_KEY` için kesinlikle güçlü, rastgele anahtarlar kullanın.** Cloudflare Turnstile anahtarlarını kendi hesabınızdan alın.
5.  Geliştirme sunucusunu başlatın: `npm run dev` veya `yarn dev`
6.  Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Son Güncellemeler

- **Admin Giriş Kontrolü Güçlendirildi**: Admin sayfalarına erişim için server-side doğrulama eklendi. Middleware ile token kontrolü yapılarak güvenlik artırıldı.
- **Reklam Yönetimi**: Admin paneline reklam ekleme, düzenleme ve silme özellikleri eklendi.
- **Köşe Reklamları**: Sitenin sağ ve sol köşelerinde gösterilen reklamlar için yönetim arayüzü eklendi.
- **Ziyaretçi İstatistikleri**: Ziyaretçi sayısı, çevrimiçi kullanıcılar ve diğer istatistikler için yönetim paneli eklendi.
- **Blog Editörüne Görsel Boyutlandırma Özelliği Eklendi**:
  - Blog içeriğinde görseller üzerine tıklandığında boyut değiştirme aracı görüntülenir
  - Görsel boyutları piksel cinsinden ayarlanabilir
  - En-boy oranını koruma/serbest bırakma seçeneği bulunur
  - Değişiklikler anında önizlenebilir ve kaydedilebilir

## API Güvenlik Sistemi

### Server Token Doğrulama

Projenin API güvenliği için server-token doğrulama sistemi eklenmiştir. Bu sistem, API endpoint'lerini yetkisiz erişimden korur ve sadece sunucu tarafında (server-side) yapılan isteklere izin verir.

#### Yapı

- `backend/middleware/serverTokenMiddleware.ts` - API isteklerinde token doğrulaması yapan middleware
- `utils/serverSideHelpers.ts` - Server-side veri çekme yardımcıları (getServerSideHeaders, serverSideFetch)

#### Kurulum ve Kullanım

1. `.env` dosyasında `SERVER_TOKEN` değişkeni tanımlayın:
   ```
   SERVER_TOKEN=your_secure_random_token_here
   ```

2. API endpoint'lerini korumak için:
   ```typescript
   import { serverTokenMiddleware } from '../backend/middleware/serverTokenMiddleware';

   async function handler(req, res) {
     // API işlemleriniz
   }

   export default serverTokenMiddleware(handler);
   ```

3. Server-side veri çekimi için:
   ```typescript
   import { serverSideFetch } from '../utils/serverSideHelpers';
   
   export const getServerSideProps = async () => {
     const data = await serverSideFetch('/api/endpoint');
     return { props: { data } };
   }
   ```

#### Güvenlik Avantajları

- API token'ı client-side kodda asla görünmez
- Tüm API istekleri server-side'dan yapılır
- Token sızıntısı riski minimize edilir
- CORS ve yetkisiz erişim koruması sağlanır

### Admin Giriş Kontrolü

Admin paneline erişim için güçlendirilmiş güvenlik sistemi uygulanmıştır:

1. **Server-side Doğrulama**: Middleware ile admin token kontrolü yapılarak yetkisiz erişimler engellenir.
2. **Çift Katmanlı Kontrol**: Hem client-side hem de server-side doğrulama yapılarak güvenlik artırılmıştır.
3. **Oturum Yönetimi**: AdminSession modeli ile aktif oturumlar takip edilir ve geçersiz oturumlar otomatik olarak temizlenir.
4. **Güvenli Cookie Yönetimi**: Admin token'ları httpOnly, secure ve SameSite=strict özellikleriyle korunur.

Admin oturum akışı:
1. Kullanıcı admin/login sayfasına gider
2. Kullanıcı adı, şifre ve Turnstile doğrulaması ile giriş yapar
3. Başarılı girişte, server-side JWT token oluşturulur ve cookie olarak ayarlanır
4. Admin sayfalarına erişim için her istekte middleware tarafından token doğrulaması yapılır
5. Geçersiz veya süresi dolmuş token durumunda kullanıcı login sayfasına yönlendirilir
