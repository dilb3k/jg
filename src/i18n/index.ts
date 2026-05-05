import { useCallback } from 'react';
import { useThemeStore } from '../store/themeStore';

export type Language = 'uz' | 'ru';

export const translations = {
  uz: {
    // Auth
    login: 'Kirish',
    username: 'Login',
    password: 'Parol',
    loginPlaceholder: 'Loginingizni kiriting',
    passwordPlaceholder: 'Parolingizni kiriting',
    loginError: 'Login xatoligi',
    noAccount: 'Hisobingiz yo\'qmi? Administratorga murojaat qiling',
    enterLoginPassword: 'Login va parolni kiriting',
    signIn: 'Kirish',

    // Navigation
    main: 'Asosiy',
    inventory: 'Ombor',
    statistics: 'Statistika',
    users: 'Foydalanuvchilar',

    // Products
    products: 'Mahsulotlar',
    addProduct: 'Yangi mahsulot',
    editProduct: 'Mahsulotni tahrirlash',
    productName: 'Mahsulot nomi',
    buyPrice: 'Kelish narxi',
    sellPrice: 'Sotish narxi',
    quantity: 'Joriy qoldiq',
    noProducts: 'Mahsulotlar hali qo\'shilmagan',
    productSaved: 'Mahsulot saqlandi',
    productDeleted: 'Mahsulot o\'chirildi',
    deleteConfirm: 'Mahsulot o\'chirilsinmi?',
    deleteMessage: 'Bu mahsulot yangi ro\'yxatlarda ko\'rinmaydi. Tarixiy ma\'lumotlar saqlanib qoladi.',
    productInfoIncorrect: 'Mahsulot ma\'lumoti noto\'g\'ri',
    barrelManagement: 'Barrel Management',
    signInToSystem: 'Tizimga kiring',

    // Products Screen
    noImage: 'Rasm yo\'q',
    currentQuantity: 'Joriy qoldiq',
    productNamePlaceholder: 'Masalan: Cola 1L',
    pricePlaceholder: '0',
    quantityPlaceholder: '0',
    addImage: 'Rasm qo\'shish',
    important: 'Hisob-kitob uchun muhim',
    price_qty_warning: 'Narx va miqdor noto\'g\'ri kiritilsa keyingi hisoblarda chalkashlik yuz beradi. Shu sabab manfiy miqdor, 0 narx va zararli sotuv avtomatik bloklanadi.',
    edit_product_warning: 'Bu yerda mahsulotning real qoldig\'i yuradi. Mahsulot kelsa yoki soni oshsa shu yerdan yangilang, ombor sahifasi ham shunga moslashadi.',

    // Restock
    restock: 'Mahsulot qo\'shish',
    restockSubtitle: 'Mahsulot kelganda qoldiqni yangilash uchun ro\'yxatdan tanlang',
    howMuchArrived: 'Qancha mahsulot keldi?',
    currentStock: 'Hozirgi qoldiq',
    addToStock: 'Qo\'shiladi',
    newStock: 'Yangi qoldiq',
    addStock: 'Qo\'shish',
    addingStock: 'Qo\'shilmoqda...',
    stockAdded: 'dona qo\'shildi. Jami:',
    stockInfo: 'Qoldiq: {quantity} dona',
    restockInfo: 'Bu yerda faqat mahsulot miqdorini oshirasiz. Yangi kelgan mahsulot miqdorini kiriting, tizim avtomatik ravishda umumiy qoldiqni yangilaydi.',
    result: 'Natija',
    buy: 'Kelish',
    sell: 'Sotish',
    add: 'Qo\'shish',

    // Inventory
    start: 'Boshlang\'ich',
    startQuantity: 'Boshlang\'ich miqdor',
    currentQuantityInv: 'Joriy miqdor',
    sold: 'Sotilgan',
    remaining: 'Qoldiq',
    revenue: 'Tushum',
    profit: 'Foyda',
    stockValue: 'Qoldiq qiymati',
    readOnly: 'Faqat ko\'rish',
    futureDate: 'Kelajak sana',
    pastDateError: 'O\'tgan kunlar uchun o\'zgartirish kiritib bo\'lmaydi!',
    cannotBeLessThanSuffix: 'tadan kam bo\'lolmaydi',
    alreadySold: 'allaqachon sotilgan',
    unitProfit: 'Birlik foyda',
    potentialProfit: 'Qolgan potensial foyda',
    totalPotentialProfit: 'Jami mumkin bo\'lgan foyda',
    progress: 'Progress',
    inventoryUpdated: 'Ombor qoldig\'i yangilandi',
    saveError: 'Saqlashda xatolik yuz berdi',
    cannotIncreaseStock: 'Joriy qoldiqni oshirib bo\'lmaydi. Mahsulot qo\'shish mahsulotlar sahifasidan qilinadi',
    inventoryInfo: 'Omborda faqat real qoldiq kiritiladi. Sotilgan miqdor avtomatik hisoblanadi. Mahsulot kelsa, mahsulotlar sahifasidan qoldiqni oshiring.',
    readOnlyMode: 'Ko\'rish rejimi',
    startQtyAuto: 'Boshlang\'ich miqdor avtomatik. Uni ombordan o\'zgartirib bo\'lmaydi.',
    todayStart: 'Bugungi boshlang\'ich',
    currentInventory: 'Ombor qoldig\'i',
    preSaveCheck: 'Saqlashdan oldingi tekshiruv',
    expectedRevenue: 'Kutilgan tushum',
    expectedProfit: 'Kutilgan foyda',
    previousSold: 'Avval sotilgan',
    newSold: 'Yangi sotilgan',
    warning_qtyAdjust: 'Omborda qoldiqni faqat kamaytirasiz. Mahsulot kelsa, mahsulotlar sahifasidan qoldiqni ko\'paytiring.',
    loadingInventory: 'Ombor ma\'lumotlari yuklanmoqda...',
    notAvailableYet: 'Hali mavjud emas',
    futureDateNotice: 'Kelajak kuni',
    futureDateNoticeText: 'Bu sana hali kelmagan, shuning uchun inventarizatsiya va savdo hisobi amalga oshirilmaydi.',
    addProductsFirst: 'Avval mahsulot qo\'shing',

    // Statistics
    daily: 'Kun',
    weekly: 'Hafta',
    monthly: 'Oy',
    yearly: 'Yil',
    selectPeriodDate: 'Davr sanasini tanlang',
    selectStartDate: 'Boshlanish sanasini tanlang',
    selectEndDate: 'Tugash sanasini tanlang',
    selectDateHint: 'Davr sanasini tanlash',
    totalRevenue: 'Tushum',
    totalProfit: 'Sof foyda',
    totalSold: 'Sotildi',
    margin: 'Marja',
    topProducts: 'Eng ko\'p sotilgan mahsulotlar',
    periodSales: 'Davrga savdo',
    noData: 'Ma\'lumot yo\'q',
    dataRefreshed: 'Ma\'lumotlar yangilandi',
    refreshError: 'Yangilashda xatolik yuz berdi',
    noSalesPeriod: 'Bu davrda hali savdo yo\'q, shuning uchun qiymatlar 0 ko\'rsatildi.',
    noProductsPeriod: 'Tanlangan davr bo\'yicha mahsulot ma\'lumoti yo\'q',

    // Rating
    rating: 'Reyting',
    date: 'Sana',
    allTimeRating: 'Barcha vaqt reytingi',
    profitPerUnit: 'Birlik foyda',
    totalProfitRating: 'Jami foyda',
    leastSold: 'Kam sotilgan',
    profitEarned: 'Olingan foyda',
    ratingNoData: 'Reyting uchun ma\'lumot topilmadi',

    // Users
    usersTitle: 'Adminlar',
    createUser: 'Yangi admin',
    userCreated: 'Admin yaratildi',
    userRole: 'Rol',
    superAdmin: 'Super Admin',
    admin: 'Admin',
    createdAt: 'Yaratilgan',
    createAdmin: 'Yangi admin yaratish',
    adminInfo: 'Yangi admin faqat mahsulot va ombor bilan ishlay oladi. Adminlar ro\'yxatini faqat superAdmin ko\'ra oladi.',
    loginPlaceholder_Admin: 'Admin loginini kiriting',
    passwordPlaceholder_Admin: 'Parolni kiriting (kamida 6 belgi)',
    passwordLength: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
    confirmCreate: 'Yaratish',

    // Settings
    settings: 'Sozlamalar',
    language: 'Til',
    theme: 'Mavzu',
    light: 'Yorug\'',
    dark: 'Tungi',
    system: 'Tizim',
    lang_uz: "O'zbek",
    lang_ru: 'Русский',
    logout: 'Chiqish',
    close: 'Yopish',

    // Common
    save: 'Saqlash',
    cancel: 'Bekor',
    delete: 'O\'chirish',
    back: 'Orqaga',
    loading: 'Yuklanmoqda...',
    error: 'Xatolik',
    success: 'Muvaffaqiyatli',
    search: 'Qidirish...',
    empty: 'Bo\'sh',
    confirm: 'Tasdiqlash',
    online: 'Online',
    offline: 'Offline',
  },

  ru: {
    // Auth
    login: 'Вход',
    username: 'Логин',
    password: 'Пароль',
    loginPlaceholder: 'Введите логин',
    passwordPlaceholder: 'Введите пароль',
    loginError: 'Ошибка входа',
    noAccount: 'Нет аккаунта? Обратитесь к администратору',
    enterLoginPassword: 'Введите логин и пароль',
    signIn: 'Войти',

    // Navigation
    main: 'Главная',
    inventory: 'Склад',
    statistics: 'Статистика',
    users: 'Пользователи',

    // Products
    products: 'Продукты',
    addProduct: 'Новый продукт',
    editProduct: 'Редактировать продукт',
    productName: 'Название продукта',
    buyPrice: 'Закупочная цена',
    sellPrice: 'Цена продажи',
    quantity: 'Текущий остаток',
    noProducts: 'Продукты еще не добавлены',
    productSaved: 'Продукт сохранен',
    productDeleted: 'Продукт удален',
    deleteConfirm: 'Удалить продукт?',
    deleteMessage: 'Этот продукт не будет отображаться в новых списках. Исторические данные сохранятся.',
    productInfoIncorrect: 'Информация о продукте неверна',

    // Products Screen
    noImage: 'Изображение отсутствует',
    currentQuantity: 'Текущий остаток',
    productNamePlaceholder: 'Например: Cola 1L',
    pricePlaceholder: '0',
    quantityPlaceholder: '0',
    addImage: 'Добавить изображение',
    important: 'Важно для расчетов',
    price_qty_warning: 'Неверные данные о цене или количестве приведут к путанице в будущих расчетах.',
    edit_product_warning: 'Здесь находится реальный остаток товара.',

    // Restock
    restock: 'Пополнение',
    howMuchArrived: 'Сколько товара прибыло?',
    currentStock: 'Текущий остаток',
    addStock: 'Добавить',
    addingStock: 'Добавление...',

    // Inventory
    start: 'Начальное',
    startQuantity: 'Начальное количество',
    currentQuantityInv: 'Текущее количество',
    sold: 'Продано',
    remaining: 'Остаток',
    revenue: 'Выручка',
    profit: 'Прибыль',
    stockValue: 'Стоимость остатка',
    readOnly: 'Только просмотр',
    futureDate: 'Будущая дата',
    inventoryUpdated: 'Остаток на складе обновлен',
    saveError: 'Ошибка при сохранении',
    cannotIncreaseStock: 'Нельзя увеличить текущий остаток. Добавление товара осуществляется на странице продуктов.',
    readOnlyMode: 'Режим просмотра',
    currentInventory: 'Остаток на складе',
    loadingInventory: 'Данные об остатках загружаются...',
    notAvailableYet: 'Еще не доступно',
    futureDateNotice: 'Будущий день закрыт',
    futureDateNoticeText: 'Эта дата еще не наступила, поэтому инвентаризация и расчет продаж не производятся.',
    addProductsFirst: 'Сначала добавьте продукты',

    // Statistics
    daily: 'День',
    weekly: 'Неделя',
    monthly: 'Месяц',
    yearly: 'Год',
    totalRevenue: 'Выручка',
    totalProfit: 'Чистая прибыль',
    totalSold: 'Продано',
    noData: 'Нет данных',
    dataRefreshed: 'Данные обновлены',
    refreshError: 'Ошибка обновления',

    // Rating
    rating: 'Рейтинг',
    date: 'Дата',
    allTimeRating: 'Рейтинг за все время',
    profitPerUnit: 'Прибыль с единицы',
    totalProfitRating: 'Общая прибыль',
    leastSold: 'Меньше всего продано',
    profitEarned: 'Полученная прибыль',
    ratingNoData: 'Данные для рейтинга не найдены',

    // Users
    usersTitle: 'Админы',
    createUser: 'Новый админ',
    userCreated: 'Админ создан',
    superAdmin: 'Супер Админ',
    admin: 'Админ',
    createAdmin: 'Создать нового администратора',

    // Settings
    settings: 'Настройки',
    language: 'Язык',
    theme: 'Тема',
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Системная',
    lang_uz: 'Узбекский',
    lang_ru: 'Русский',
    logout: 'Выход',
    close: 'Закрыть',

    // Common
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    back: 'Назад',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    search: 'Поиск...',
    confirm: 'Подтвердить',
  },
} as const;

// Type for translation keys
export type TranslationKey = keyof typeof translations.uz;

/**
 * Hook for internationalization
 */
export const useI18n = () => {
  const language = useThemeStore((state) => state.language);
  const setLanguageFromStore = useThemeStore((state) => state.setLanguage);

  const t = useCallback((key: TranslationKey, params?: Record<string, any>): string => {
    let text = translations[language][key] || key;

    if (params) {
      Object.keys(params).forEach((paramKey) => {
        const placeholder = `{${paramKey}}`;
        text = text.replace(new RegExp(placeholder, 'g'), String(params[paramKey]));
      });
    }

    return text;
  }, [language]);

  const setLanguage = useCallback(async (newLanguage: Language) => {
    await setLanguageFromStore(newLanguage);
  }, [setLanguageFromStore]);

  return {
    language,
    setLanguage,
    t,
  };
};

/**
 * Simple translate function for non-hook usage
 */
export const translate = (key: TranslationKey, lang: Language = 'uz', params?: Record<string, any>): string => {
  let text = translations[lang][key] || key;

  if (params) {
    Object.keys(params).forEach((paramKey) => {
      const placeholder = `{${paramKey}}`;
      text = text.replace(new RegExp(placeholder, 'g'), String(params[paramKey]));
    });
  }

  return text;
};