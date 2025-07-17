import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Token için gizli anahtar - gerçek projede .env dosyasından alınmalı
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'default-secret-key-change-in-production';

// IP adresini almak için yardımcı fonksiyon
function getClientIp(req: NextRequest): string {
  // X-Forwarded-For header'ından IP'yi al (proxy arkasında çalışırken)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Gerçek IP adresini al
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Hiçbiri yoksa varsayılan değer döndür
  return '127.0.0.1';
}

// Ücretsiz proxy tespit API'leri ile IP kontrolü
const checkProxyWithAPI = async (ip: string): Promise<{ isProxy: boolean; reason?: string; service?: string }> => {
  // Localhost ve private IP'leri geç
  if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || 
      ip.startsWith('10.') || ip.startsWith('172.') || ip === 'unknown') {
    return { isProxy: false };
  }


    // 1. IP-API.com Pro (Ücretli versiyon)
  try {
    // İlk API anahtarı ile deneme
    let ipApiResponse;
    try {
      ipApiResponse = await axios.get(`https://pro.ip-api.com/json/${ip}?fields=66842623&key=ipapiq9SFY1Ic4`, {
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
          'Accept': '*/*',
          'Accept-Language': 'tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Referer': 'https://members.ip-api.com/',
          'Origin': 'https://members.ip-api.com',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'Priority': 'u=0'
        }
      });
    } catch (err) {
      // İlk anahtar hata verirse, yedek anahtarı kullan
      ipApiResponse = await axios.get(`https://pro.ip-api.com/json/${ip}?fields=66842623&key=BwfSJxuANSbGW0B`, {
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
          'Accept': '*/*',
          'Accept-Language': 'tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Referer': 'https://members.ip-api.com/',
          'Origin': 'https://members.ip-api.com',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'Priority': 'u=0'
        }
      });
    }
    
    if (ipApiResponse.data) {
      const result = ipApiResponse.data;
      if (result.proxy || result.hosting) {
        return { 
          isProxy: true, 
          reason: `IP-API Pro: ${result.proxy ? 'Proxy' : 'Hosting/Datacenter'} IP tespit edildi`,
          service: 'ip-api.com-pro'
        };
      }
    }
  } catch (error: any) {
    console.warn('IP-API.com Pro hatası:', error.message);
  }

  return { isProxy: true }; // proxy sistemi hata verirse proxy olarak kabul et
};

// Yerel proxy tespit fonksiyonu - Header analizi
const detectProxyHeaders = (req: NextRequest): { isProxy: boolean; reason?: string } => {
  // Bilinen proxy header'larını kontrol et
  const proxyHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-proxy-id',
    'via',
    'x-forwarded-proto',
    'x-forwarded-host',
    'proxy-client-ip',
    'wl-proxy-client-ip',
    'http_x_forwarded_for',
    'http_client_ip',
    'http_forwarded_for',
    'http_via'
  ];
  
  // Şüpheli proxy header'larını kontrol et
  for (const header of proxyHeaders) {
    const headerValue = req.headers.get(header);
    if (headerValue) {
      // x-forwarded-for normal olabilir, ancak çoklu IP varsa proxy olabilir
      if (header === 'x-forwarded-for') {
        const forwardedIps = headerValue.split(',');
        if (forwardedIps.length > 2) {
          return { isProxy: true, reason: 'Çoklu proxy zinciri tespit edildi' };
        }
      } else if (header === 'via') {
        return { isProxy: true, reason: 'Proxy via header tespit edildi' };
      } else if (header.includes('proxy')) {
        return { isProxy: true, reason: 'Proxy header tespit edildi' };
      }
    }
  }
  
  // User-Agent kontrolü - Bot veya proxy client'ları tespit et
  const userAgent = req.headers.get('user-agent');
  if (!userAgent) {
    return { isProxy: true, reason: 'User-Agent header eksik' };
  }
  
  const suspiciousAgents = [
    'proxy', 'vpn', 'tor', 'anonymizer', 'hide', 'mask', 'tunnel',
    'phantom', 'spider', 'crawler', 'bot', 'curl', 'wget'
  ];
  
  const lowerAgent = userAgent.toLowerCase();
  for (const suspicious of suspiciousAgents) {
    if (lowerAgent.includes(suspicious)) {
      return { isProxy: true, reason: 'Şüpheli user agent tespit edildi' };
    }
  }
  
  // Accept-Language kontrolü - Proxy'ler genelde bu header'ı eksik bırakır
  if (!req.headers.get('accept-language')) {
    return { isProxy: true, reason: 'Accept-Language header eksik' };
  }
  
  return { isProxy: false };
};

// Kombine proxy tespit fonksiyonu - Hem API hem header kontrolü
const detectProxy = async (req: NextRequest, clientIp: string): Promise<{ isProxy: boolean; reason?: string; service?: string }> => {
  // Önce header kontrolü yap (hızlı)
  const headerCheck = detectProxyHeaders(req);
  if (headerCheck.isProxy) {
    return { isProxy: true, reason: headerCheck.reason, service: 'header_analysis' };
  }
  
  // Sonra API ile kontrol et (daha kesin)
  const apiCheck = await checkProxyWithAPI(clientIp);
  if (apiCheck.isProxy) {
    return apiCheck;
  }
  
  return { isProxy: false };
};

// AES-256-GCM ile veri şifreleme fonksiyonu (Edge Runtime uyumlu)
async function encryptData(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Secret'tan AES anahtarı türet
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Rastgele salt oluştur
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // AES-256-GCM anahtarını türet
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Rastgele IV oluştur
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Veriyi şifrele
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(data)
  );
  
  // Salt + IV + şifrelenmiş veri formatında birleştir
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  // Base64 formatında döndür
  return btoa(String.fromCharCode(...Array.from(result)));
}

// AES-256-GCM ile veri çözme fonksiyonu
async function decryptData(encryptedData: string, secret: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Base64'ten çöz
    const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    
    // Salt, IV ve şifrelenmiş veriyi ayır
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);
    
    // Secret'tan AES anahtarı türet
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // AES-256-GCM anahtarını türet
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Veriyi çöz
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Veri çözme hatası:', error);
    throw new Error('Veri çözme başarısız');
  }
}

// HMAC-SHA256 tabanlı güvenli imzalama fonksiyonu (Edge Runtime uyumlu)
async function createHmacSignature(data: string, secret: string): Promise<string> {
  // Secret'ı Uint8Array'e çevir
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  
  // HMAC anahtarını oluştur
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Veriyi imzala
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  
  // İmzayı base64 formatına çevir
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(signature))));
}

// İmza doğrulama fonksiyonu
async function verifyHmacSignature(data: string, signature: string, secret: string): Promise<boolean> {
  try {
    const expectedSignature = await createHmacSignature(data, secret);
    return signature === expectedSignature;
  } catch (error) {
    console.error('İmza doğrulama hatası:', error);
    return false;
  }
}

// Güvenli token oluşturma fonksiyonu - AES-256-GCM şifreli + HMAC-SHA256 imzalı
async function createToken(ip: string): Promise<string> {
  const id = uuidv4();
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 saat sonra
  const timestamp = Date.now().toString();
  
  // Token verisi: IP, ID, son kullanma tarihi ve timestamp
  const tokenData = {
    ip,
    id,
    exp: expiry,
    ts: timestamp,
    // Ek güvenlik için rastgele nonce ekle
    nonce: Math.random().toString(36).substring(2, 15)
  };
  
  // Token verisini JSON string'e çevir
  const tokenString = JSON.stringify(tokenData);
  
  // AES-256-GCM ile şifrele (artık IP, ID gibi bilgiler görünmez)
  const encryptedToken = await encryptData(tokenString, TOKEN_SECRET);
  
  // HMAC-SHA256 ile güvenli imza oluştur
  // İmzalanacak veri: şifrelenmiş token + timestamp
  const dataToSign = `${encryptedToken}.${timestamp}`;
  const signature = await createHmacSignature(dataToSign, TOKEN_SECRET);
  
  // Token formatı: encryptedData.signature
  return `${encryptedToken}.${signature}`;
}

// Güvenli token doğrulama fonksiyonu - AES-256-GCM çözme + HMAC-SHA256 doğrulama
async function verifyToken(token: string, ip: string): Promise<boolean> {
  try {
    // Token'ı parçalara ayır
    const [encryptedData, signature] = token.split('.');
    
    if (!encryptedData || !signature) {
      console.error('Token formatı geçersiz');
      return false;
    }
    
    // Önce şifrelenmiş veriyi çöz
    let tokenString: string;
    try {
      tokenString = await decryptData(encryptedData, TOKEN_SECRET);
    } catch (error) {
      console.error('Token çözme hatası - manipüle edilmiş olabilir:', error);
      return false;
    }
    
    // JSON parse et
    const tokenData = JSON.parse(tokenString) as { 
      ip: string, 
      id: string, 
      exp: number, 
      ts: string,
      nonce: string 
    };
    
    // Gerekli alanların varlığını kontrol et
    if (!tokenData.ip || !tokenData.id || !tokenData.exp || !tokenData.ts || !tokenData.nonce) {
      console.error('Token verisi eksik alanlar içeriyor');
      return false;
    }
    
    // İmzayı doğrula - aynı veri formatını kullan
    const dataToVerify = `${encryptedData}.${tokenData.ts}`;
    const isSignatureValid = await verifyHmacSignature(dataToVerify, signature, TOKEN_SECRET);
    
    if (!isSignatureValid) {
      console.error('Token imzası geçersiz - manipüle edilmiş');
      return false;
    }
    
    // Süre kontrolü
    if (tokenData.exp < Date.now()) {
      console.error('Token süresi dolmuş');
      return false;
    }
    
    // IP kontrolü
    if (tokenData.ip !== ip) {
      console.error('Token IP adresi uyuşmuyor');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return false;
  }
}

export async function middleware(req: NextRequest) {
    // Oy verme API'leri için proxy kontrolü
    if (req.nextUrl.pathname === '/api/streamers/vote' || req.nextUrl.pathname === '/api/servers/vote') {
        if (req.method === 'POST') {
          console.log("Oy verme API'si çağrıldı, proxy kontrolü başlatıldı ");
            const clientIp = getClientIp(req);
            
            // Proxy/VPN kontrolü yap
            const proxyCheck = await detectProxy(req, clientIp);
            
            if (proxyCheck.isProxy) {
                console.warn(`Proxy/VPN engellendi: ${clientIp}, Sebep: ${proxyCheck.reason}, Servis: ${proxyCheck.service}`);
                
                return NextResponse.json(
                    {
                        success: false,
                        error: 'forbidden5',
                        reason: 'proxy_detected',
                        canVote: false
                    },
                    { status: 403 }
                );
            }
            
            // Proxy tespit edilmedi, devam et
            console.log(`Proxy kontrolü başarılı: ${clientIp}`);
        }
    }
    
    // Admin API'leri için bypass
    if(req.nextUrl.pathname.startsWith('/api/admin/')) {
        return NextResponse.next();
    }
    
    // Admin sayfalarına erişim kontrolü
    if(req.nextUrl.pathname.startsWith('/admin') && !req.nextUrl.pathname.startsWith('/admin/login')) {
        // Admin token kontrolü
        const adminToken = req.cookies.get('adminToken');
        
        // Token yoksa login sayfasına yönlendir
        if (!adminToken) {
            return NextResponse.redirect(new URL('/admin/login?session=expired', req.url));
        }
        
        try {
            // Admin token'ı doğrulamak için API çağrısı yap
            // Not: Bu kısım Edge Runtime ile uyumlu olmalı
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            const host = req.headers.get('host') || 'localhost:3000';
            const baseUrl = `${protocol}://${host}`;
            
            const response = await fetch(`${baseUrl}/api/admin/auth/me`, {
                headers: {
                    Cookie: `adminToken=${adminToken.value}`
                }
            });
            
            // API yanıtını kontrol et
            if (!response.ok) {
                // Token geçersiz, login sayfasına yönlendir
                return NextResponse.redirect(new URL('/admin/login?session=expired', req.url));
            }
            
            const data = await response.json();
            
            if (!data.success) {
                // Token geçersiz, login sayfasına yönlendir
                return NextResponse.redirect(new URL('/admin/login?session=expired', req.url));
            }
            
            // Token geçerli, devam et
            return NextResponse.next();
        } catch (error) {
            console.error('Admin token doğrulama hatası:', error);
            // Hata durumunda login sayfasına yönlendir
            return NextResponse.redirect(new URL('/admin/login?session=error', req.url));
        }
    }
    
  // Internal API istekleri için özel bir secret header kontrolü
  const apiKey = req.headers.get('x-api-key');
  const adminKey = req.headers.get('x-admin-key');
  if (apiKey === process.env.API_KEY || adminKey === process.env.ADMIN_KEY) {
      return NextResponse.next();
   }

    // Normal sayfa erişimi için cookie kontrolü
    const uidCookie = req.cookies.get('api_access');
    const clientIp = getClientIp(req);
 
    // Eğer cookie yoksa veya geçersizse, yeni bir token oluştur
    let needsNewToken = false;
    
    if (!uidCookie) {
      needsNewToken = true;
    } else {
      // Token'ı doğrula
      const isValid = await verifyToken(uidCookie.value, clientIp);
      if (!isValid) {
        needsNewToken = true;
      }
    }
 
    if (needsNewToken) {
      // Yeni bir token oluştur
      const token = await createToken(clientIp);
 
      const res = NextResponse.next();
      
      // Ortama göre secure flag'ini ayarla
      const isSecure = process.env.NODE_ENV === 'production';
 
      // Set-Cookie header'ı ekle
      res.cookies.set('api_access', token, {
        httpOnly: true,      // JavaScript ile erişilemez
        secure: isSecure,    // Production'da sadece HTTPS, geliştirmede HTTP
        sameSite: 'strict',  // Sadece aynı siteden isteklerde gönderilir
        path: '/',           // Tüm site için geçerli
        maxAge: 60 * 60 * 24, // 1 gün (saniye cinsinden)
      });
 
      return res;
    }
 
   
  // API istekleri için özel kontrol
  if (req.nextUrl.pathname.startsWith('/api/')) {

    
    const uidCookie = req.cookies.get('api_access');
    const clientIp = getClientIp(req);
    
    // Cookie yoksa erişimi reddet
    if (!uidCookie) {
      return NextResponse.json(
        { 
          error: 'Forbidden2' 
        },
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    // Token'ı doğrula
    const isValid = await verifyToken(uidCookie.value, clientIp);
    
    if (!isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid token' 
        },
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    // Token geçerli, devam et
    return NextResponse.next();
  }
  

}

// Middleware'in çalışacağı rotaları belirt
export const config = {
  matcher: [
    // Statik dosyalar hariç tüm route'lar
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Özel olarak oy verme API'leri
    '/api/streamers/vote',
    '/api/servers/vote'
  ]
};
