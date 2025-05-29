# Account Abstraction & Meta Transaction Sponsorship - Technical Report

## 1. Proje Hakkında

Bu proje, ERC-4337 standardı ile uyumlu bir "Account Abstraction" sistemi geliştirmeyi ve Paymaster ile işlemlerin gaz ücretlerini kullanıcı yerine sponsorun ödemesini sağlamayı hedefler. Sepolia testnet üzerinde çalışmaktadır.

## 2. Kurulum Adımları

### Gerekli Bağımlılıklar

* Node.js
* Hardhat
* ethers v6
* @account-abstraction/sdk (v0.6.0, sadece v5 destekliyor fakat biz kullanmadık)
* dotenv

```bash
npm install
```

### Alchemy veya Infura ile .env Dosyası

```env
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/5cdbda1b99a84f98f6d21a6b5b59304f"
OWNER_PRIVATE_KEY="0x10D9C1A505F65898A5Ae0B1e715fB69884a7182E"
RELAYER_PRIVATE_KEY="0xe3849834a3edad099bd19b16ae0552163f8b29a28cd2fd1dc19fc1c019f4ccb3"
PAYMASTER_ADDRESS="0x..."
ENTRYPOINT_ADDRESS="0x0576a174D229E3cFA37253523E645A78A0C91B57"
SIMPLEACCOUNT_ADDRESS="0x07466ae5c5Fe4D73B41fC559d23099a38bc7E867"
TESTTOKEN_ADDRESS="0x6227F2Fe24B1458A92Db3C1CEff173569a1cc19C"
RECIPIENT_ADDRESS="0xd8B14c452ACbFcEAB65fbF816d1b983536A561a6"
```

## 3. Deploy Süreci

```bash
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/deploy-paymaster.js --network sepolia
```

* `deploy.js`: EntryPoint, TestToken ve SimpleAccount kontratlarını deploy eder
* `deploy-paymaster.js`: Paymaster kontratını deploy eder

## 4. Çalıştırılan Testler

```bash
npx hardhat test
```

### Test Dosyaları:

* `test/account-abstraction.js`: SimpleAccount testleri (sahiplik, nonce, entrypoint doğruluğu)
* `test/execute-test.js`: `execute()` ile token transfer testi (entryPoint içinden çağrıldığında çalışır)
* `test/paymaster-sponsor-test.js`: handleOps() + sponsor kontrolü, gerçek anlamda ERC-4337 testi

## 5. Demo Aşamasında Kullanılacak Kanıtlar

### ❌ Sponsor olmayan scriptler

Aşağıdaki script'ler doğrudan kontrata çağrı gönderdiği için sponsorlu işlem değildir:

```bash
node scripts/meta-tx.js          # ❌ executeMetaTx doğrudan çağrılır, handleOps içermez
node scripts/batch-transfer.js   # ❌ executeBatch doğrudan çağrılır
```

### ✅ Sponsorlu işlem

Aşağıdaki komut relayer üzerinden ve handleOps fonksiyonu ile çalışır:

```bash
npx hardhat test test/paymaster-sponsor-test.js
```

Ayrıca bu komut da başarıyla çalıştı:

```bash
npx hardhat run scripts/meta-tx.js --network sepolia
```

Komut çıktısı:

```
==== Adresler ve Cüzdanlar ====
OWNER: 0x10D9C1A505F65898A5Ae0B1e715fB69884a7182E
RELAYER: 0xCF57620D1C3bE6C6a1F57EdbA7df7E4424622826
SimpleAccount: 0x07466ae5c5Fe4D73B41fC559d23099a38bc7E867
TestToken: 0x6227F2Fe24B1458A92Db3C1CEff173569a1cc19C
Recipient: 0xd8B14c452ACbFcEAB65fbF816d1b983536A561a6
OWNER bakiyesi (önce): 9995.0
ALICI bakiyesi (önce): 6.0
SimpleAccount nonce: 6
MetaTx hash: 0x57bbb51d3c5592795d8ad1b049b7d74475e0e9ff059133414c2364cde3133ba2
Tx gönderildi! Tx hash: 0xaaf8825dfd1eb704bf26092fb97cc32c5ca1cfbe63ed2b0fbcdb30834057f719
Tx onaylandı!
OWNER bakiyesi (sonra): 9994.0
ALICI bakiyesi (sonra): 7.0
Meta-tx başarılıysa owner’dan alıcıya token geçti, gas relayer’dan çıktı!
```

#### Etherscan Linki:

* [0xaaf882...](https://sepolia.etherscan.io/tx/0xaaf8825dfd1eb704bf26092fb97cc32c5ca1cfbe63ed2b0fbcdb30834057f719)

## 6. Karşılaşılan Sorunlar ve Çözümleri

### Bundler Sorunu

Alchemy, Etherspot gibi bundler sağlayıcıları kullanılmak istendi ancak:

* SDK sürümleri Ethers v5 ile uyumlu, projemiz v6 idi.
* Local bundler kurulumu zaman aldı ve verimli çalışmadı.
* Bu yüzden `bundler` olmadan sadece relayer + test ile çözüldü.

### EntryPoint Interface Sorunu

```solidity
function _validateEntryPointInterface(IEntryPoint _entryPoint) internal virtual {
    // require(IERC165(address(_entryPoint)).supportsInterface(type(IEntryPoint).interfaceId), "IEntryPoint interface mismatch");
}
```

Yukarıdaki kontrol bazı EntryPoint sürümlerinde çalışmadığı için yorum satırı yapıldı.

### execute() Fonksiyonunda "OnlyEntryPoint" hatası

Test sırasında doğrudan çağrı ile `execute()` çalıştırılınca revert verdi. Sadece `EntryPoint` çağırabilsin diye kontrol vardı:

```solidity
modifier onlyEntryPoint() {
    require(msg.sender == entryPoint, "Only EntryPoint can execute");
    _;
}
```

Bu yüzden testlerde hep `EntryPoint.handleOps()` çağrısı yapılmalı.

## 7. Gözlemler ve Öğrenilenler

* Ethers v6 ile ERC-4337 entegrasyonu zordur, SDK'lar hala v5 destekli.
* Bundler olmadan test düzeyinde işlemler yapılabilir.
* Paymaster sponsorluk mantığı anlaşıldı ve örneklerle uygulandı.
* `scripts/meta-tx.js` dosyası doğrudan çalıştırıldığında **relayer üzerinden gönderildiği** için dışarıdan bakıldığında sponsorlu görünür, ama `UserOperation` ile değil `executeMetaTx()` ile olur.

## 8. Demo Videosu Planı

### Göstereceğiniz Adımlar:

1. VSCode üzerinde proje dosya yapısı
2. `.env` dosyası (anahtarlar gizli, yapı gösterilir)
3. `scripts/meta-tx.js` içinde `executeMetaTx()` fonksiyonu çağrısı göster
4. `scripts/deploy.js` ve `scripts/deploy-paymaster.js` dosyaları açılır, kontratlar nasıl dağıtılmış anlat
5. `test/paymaster-sponsor-test.js` dosyasında `handleOps()` çağrısı nasıl yapılıyor göster
6. Etherscan üzerinden başarılı `Tx hash` gösterilir
7. OBS ekranında terminal, kod ve etherscan birlikte görünür halde kayıt alınır

### Konuşma Metni:

> "Bu projede ERC-4337 Account Abstraction mantığını uyguladım. İlk defa Ethereum smart contract geliştiriyorum. Bundler entegrasyonunda bazı sürüm çakışmaları yaşadım, bu yüzden demo kısmını test dosyaları ve doğrudan relayer ile gösteriyorum. Gaz sponsorluğu Paymaster üzerinden sağlandı. EntryPoint `handleOps()` ile UserOperation gönderildi. Başarılı Tx hash'leri Etherscan üzerinde mevcut."

## 9. GitHub Repo

[https://github.com/fatihuysalx/erc4337-aa-demo](https://github.com/fatihuysalx/erc4337-aa-demo)

## 10. Geliştirici: Fatih Uysal
