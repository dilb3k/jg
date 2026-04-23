# Game Club Bar

Expo Router asosidagi mobil kassir ilovasi. Ilova mahsulotlar, sotuvlar, offline queue va server bilan sync oqimini boshqaradi.

## Lokal ishga tushirish

```bash
npm install
```

`.env` fayl yarating va backend manzilini kiriting:

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-api.example.com/api
```

So'ng dev serverni ishga tushiring:

```bash
npm run start
```

## Android APK / EAS build

1. `.env` ichida `EXPO_PUBLIC_API_BASE_URL` production backend URL bilan to'ldirilgan bo'lsin.
2. Expo akkauntda login qiling: `eas login`
3. Android buildni yuboring:

```bash
eas build --platform android --profile preview
```

Production build uchun:

```bash
eas build --platform android --profile production
```

## Tekshirilgan holat

- `npm run lint` muvaffaqiyatli o'tdi
- `tsc --noEmit` muvaffaqiyatli o'tdi
- `expo export --platform android` muvaffaqiyatli o'tdi

## Eslatma

- Haqiqiy APK qurilmada ishlashi uchun `.env` dagi `EXPO_PUBLIC_API_BASE_URL` albatta real server URL bo'lishi kerak.
