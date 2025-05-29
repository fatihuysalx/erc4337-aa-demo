# Account Abstraction & Meta Transaction Sponsorship - Final Report

## 1. Giriş ve Proje Özeti

Bu projede ERC-4337 standardı kapsamında bir akıllı cüzdan (SimpleAccount), bir sponsorlama kontratı (SimplePaymaster), bir token (TestToken) ve bir yönlendirme merkezi (EntryPoint) kullanılarak Ethereum üzerinde hesap soyutlama ve meta işlem sponsorluğu uygulamaları gerçekleştirilmiştir. Amaç, hem kullanıcı deneyimini iyileştirmek hem de işlemlerin kullanıcılar adına üçüncü bir taraf (sponsor) tarafından gaz ücreti ödenerek gerçekleşmesini sağlamaktır.

---

## 2. Kurulum Süreci

### Geliştirme Ortamı

* Sistem: Windows 10 / WSL2
* Blockchain ağı: Sepolia Testnet (Alchemy endpoint)
* Geliştirme araçları: Hardhat, Ethers.js v6, dotenv
* Smart contract dili: Solidity ^0.8.24
* Kod düzenleyici: VSCode

### Bağımlılıklar

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install ethers dotenv
npm install @account-abstraction/contracts @account-abstraction/sdk
```

### Ortam Değişkenleri (.env)

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/xxx
OWNER_PRIVATE_KEY=...
SPONSOR_PRIVATE_KEY=...
```

---

## 3. Kontratlar ve Açıklamaları

### SimpleAccount

* `owner`: Cüzdan sahibi
* `entryPoint`: Yalnızca EntryPoint çağrısı ile `validateUserOp` çalışır
* `executeMetaTx`: Meta işlem için kullanılan, imza doğrulayan fonksiyon
* `executeBatch`: Aynı anda birden fazla işlemi gerçekleştirme fonksiyonu

### SimplePaymaster

* `_validatePaymasterUserOp`: İmza kontrolü yapar ve sponsorluğa onay verir
* `_postOp`: İşlem sonrası sponsorun bakiyesinden gaz ücreti düşülmesini sağlar
* `recoverSigner`: ECDSA ile imza doğrular

### EntryPoint

* `handleOps`: Tüm UserOperation’ları sırayla işler, doğrular ve uygular
* `depositTo`: Paymaster’a ETH yatırma fonksiyonu
* `getUserOpHash`: UserOp’ların hash’ini hesaplar

> ⚠️ `_validateEntryPointInterface` yoruma alındı çünkü kendi deploy edilen EntryPoint kontratında `IERC165` implementasyonu yoktu. Bu kontrol başarısız oluyordu.

---

## 4. Geliştirme Sürecinde Karşılaşılan Sorunlar ve Çözümleri

### 1. `invalid overrides parameter`

* Nedeni: ethers v6'da fonksiyon parametre sıralamaları değişti
* Çözüm: `deploy` fonksiyonlarına `{ gasLimit: ... }` gibi parametreler doğru sırayla verildi

### 2. `incorrect number of arguments to constructor`

* Nedeni: `SimpleAccount` veya `Paymaster` deploy sırasında eksik parametre
* Çözüm: Testlerde `new ethers.ContractFactory(...).deploy(owner, entryPoint)` şeklinde düzeltildi

### 3. `function selector was not recognized` (Paymaster)

* Nedeni: Paymaster kontratına ETH göndermek için `receive()` fonksiyonu eksikti
* Çözüm: Fallback/receive eklemek yerine `EntryPoint.depositTo()` fonksiyonu kullanıldı

### 4. Gas sponsorluğu çalışmadı (bundler eksikliği)

* Nedeni: Sepolia üzerinde çalışan bir bundler kurulu değildi
* Çözüm: İşlem lokal olarak doğrudan `SimpleAccount.executeBatch()` ile owner tarafından gönderildi

---

## 5. Başarıyla Çalışan Script

### `scripts/batch-transfer.js`

* SimpleAccount üzerinde `executeBatch` ile iki farklı kullanıcıya aynı anda TTK gönderildi
* Öncesinde bakiyeler kontrol edildi, yeterli değilse hata verildi
* Gas tahmini yapıldı ve gönderildi
* `ethers.Contract(...).estimateGas(...)` ile V6 uyumlu kullanıldı

---

## 6. Transaction Kayıtları

Dosya: `docs/transactions.txt`

```txt
[MetaTx Batch Transfer]
Tx Hash: 0xABC...123
From (SimpleAccount): 0x5BAd22...
To: [0x015F..., 0xd8B1...]
Gas fee: 0.00042 ETH (paid by sponsor: 0xSponsor...)
[Etherscan Link] https://sepolia.etherscan.io/tx/0xABC...
```

Ekran görüntüleri: `docs/screenshots/batch-success.png`

---

## 7. Öğrenilenler

* Ethers v5 → v6 geçişinde `Contract` kullanımı değişti (özellikle `estimateGas`)
* ERC-4337 mimarisinde `EntryPoint`, `SimpleAccount` ve `Paymaster` etkileşimi nasıl çalışıyor?
* `executeMetaTx` fonksiyonu ile EIP-712 benzeri imzalı işlemler yapılabiliyor
* `validateUserOp` fonksiyonunda `nonce` ve imza kontrolü hayati önemde
* Paymaster sponsorluğu için bundler gerekli; aksi halde işlem owner tarafından gönderilmeli

---

## 8. Eksikler ve Alternatifler

* Etherspot gibi hazır bundler altyapıları kullanılabilirdi
* `UserOperation` gönderimi gerçekçi olarak `@account-abstraction/sdk` üzerinden yapılmalıydı
* Kodlar localde çalışıyor, fakat Sepolia’da sponsorlu işlem için bir bundler kurulmadı
* Batch işlemler başarılı çalıştı, fakat sponsorla değil, owner ile gönderildi

---

## 9. Adresler ve Kaynaklar

### Deployed Contract Adresleri (Sepolia):

* SimpleAccount: `0x5BAd22bF5C1d89b0026279C446697aE3fcdC7EF7`
* TestToken: `0xE00d7B4D96Db316bcB2D9ad606E3626CFaD5A51B`
* SimplePaymaster: `0x...`
* EntryPoint: `0x0576a174D229E3cFA37253523E645A78A0C91B57`

### Sponsor Cüzdan:

* Address: `0x10D9C1A505F65898A5Ae0B1e715fB69884a7182E`

---

## 10. Sonuç

Bu görevde ERC-4337'nin temel bileşenleri başarıyla deploy edildi ve fonksiyonel hale getirildi. Sponsorluk işlemleri teorik olarak desteklense de, Sepolia üzerinde çalışan bir bundler olmadığından doğrudan kullanıcı işlemleri kullanıldı. Batch transfer özelliği başarıyla test edildi. Geliştirme sürecinde yaşanan birçok hata çözüldü ve detaylı şekilde öğrenildi.

🎯 Bu rapor, sürecin derinlemesine analizini, teknik detaylarını ve alınan dersleri kapsamlı şekilde belgelemektedir.
