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
    
    // Inventory
    startQuantity: 'Boshlang\'ich miqdor',
    currentQuantity: 'Joriy miqdor',
    sold: 'Sotilgan',
    remaining: 'Qoldiq',
    revenue: 'Tushum',
    profit: 'Foyda',
    stockValue: 'Qoldiq qiymati',
    readOnly: 'Faqat ko\'rish',
    futureDate: 'Kelajak sana',
    pastDateError: 'O\'tgan kunlar uchun o\'zgartirish kiritib bo\'lmaydi!',
    cannotBeLessThan: 'Boshlang\'ich miqdor',
    cannotBeLessThanSuffix: 'tadan kam bo\'lolmaydi',
    alreadySold: 'allaqachon sotilgan',
    
    // Statistics
    daily: 'Kun',
    weekly: 'Hafta',
    monthly: 'Oy',
    yearly: 'Yil',
    totalRevenue: 'Tushum',
    totalProfit: 'Sof foyda',
    totalSold: 'Sotildi',
    margin: 'Marja',
    topProducts: 'Eng ko\'p sotilgan mahsulotlar',
    periodSales: 'Davrga savdo',
    noData: 'Ma\'lumot yo\'q',
    dataRefreshed: 'Ma\'lumotlar yangilandi',
    refreshError: 'Yangilashda xatolik yuz berdi',
    
    // Users
    usersTitle: 'Adminlar',
    createUser: 'Yangi admin',
    userCreated: 'Admin yaratildi',
    userRole: 'Rol',
    superAdmin: 'Super Admin',
    admin: 'Admin',
    createdAt: 'Yaratilgan',
    
    // Settings
    settings: 'Sozlamalar',
    language: 'Til',
    theme: 'Mavzu',
    light: 'Yorug\'',
    dark: 'Tungi',
    system: 'Tizim',
    logout: 'Chiqish',
    userInfo: 'Foydalanuvchi ma\'lumotlari',
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
    syncPending: 'Sinxdan o\'tishi kerak',
    syncing: 'Sinxdan o\'tmoqda...',
    syncComplete: 'Sinx yakunlandi',
    syncError: 'Sinx bajarilmadi',
    initializationError: 'Boshlashda xatolik yuz berdi',
    productLoadError: 'Mahsulotlar yuklanmadi',
    inventoryLoadError: 'Ombor ma\'lumotlari yuklanmadi',
    snapshotLoadError: 'Snapshotlar yuklanmadi',
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
    barrelManagement: 'Barrel Management',
    signInToSystem: 'Войти в систему',
    
    // Restock
    restock: 'Пополнение',
    restockSubtitle: 'Выберите из списка для обновления остатка при поступлении товара',
    howMuchArrived: 'Сколько товара прибыло?',
    currentStock: 'Текущий остаток',
    addToStock: 'Добавить',
    newStock: 'Новый остаток',
    addStock: 'Добавить',
    addingStock: 'Добавление...',
    stockAdded: 'штук добавлено. Всего:',
    
    // Inventory
    startQuantity: 'Начальное количество',
    currentQuantity: 'Текущее количество',
    sold: 'Продано',
    remaining: 'Остаток',
    revenue: 'Выручка',
    profit: 'Прибыль',
    stockValue: 'Стоимость остатка',
    readOnly: 'Только просмотр',
    futureDate: 'Будущая дата',
    pastDateError: 'Нельзя вносить изменения за прошедшие дни!',
    cannotBeLessThan: 'Начальное количество не может быть меньше',
    cannotBeLessThanSuffix: 'штук',
    alreadySold: 'уже продано',
    
    // Statistics
    daily: 'День',
    weekly: 'Неделя',
    monthly: 'Месяц',
    yearly: 'Год',
    totalRevenue: 'Выручка',
    totalProfit: 'Чистая прибыль',
    totalSold: 'Продано',
    margin: 'Маржа',
    topProducts: 'Самые продаваемые продукты',
    periodSales: 'Продажи за период',
    noData: 'Нет данных',
    dataRefreshed: 'Данные обновлены',
    refreshError: 'Ошибка обновления',
    
    // Users
    usersTitle: 'Админы',
    createUser: 'Новый админ',
    userCreated: 'Админ создан',
    userRole: 'Роль',
    superAdmin: 'Супер Админ',
    admin: 'Админ',
    createdAt: 'Создан',
    
    // Settings
    settings: 'Настройки',
    language: 'Язык',
    theme: 'Тема',
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Системная',
    logout: 'Выход',
    userInfo: 'Информация о пользователе',
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
    empty: 'Пусто',
    confirm: 'Подтвердить',
    online: 'Онлайн',
    offline: 'Офлайн',
    syncPending: 'Требуется синхронизация',
    syncing: 'Синхронизация...',
    syncComplete: 'Синхронизация завершена',
    syncError: 'Ошибка синхронизации',
    initializationError: 'Ошибка инициализации',
    productLoadError: 'Не удалось загрузить продукты',
    inventoryLoadError: 'Не удалось загрузить данные склада',
    snapshotLoadError: 'Не удалось загрузить снимки',
  },
};

// Type for translation keys
export type TranslationKey = keyof typeof translations.uz;

/**
 * Hook for internationalization
 */
export const useI18n = () => {
  const language = useThemeStore((state) => state.language);
  const setLanguageFromStore = useThemeStore((state) => state.setLanguage);

  /**
   * Translate a key to the current language
   */
  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  /**
   * Set the language and persist to storage
   */
  const setLanguage = useCallback(async (newLanguage: Language) => {
    await setLanguageFromStore(newLanguage);
  }, [setLanguageFromStore]);

  return {
    language,
    setLanguage,
    t,
    translations: translations[language],
  };
};

/**
 * Simple translate function for non-hook usage
 */
export const t = (key: TranslationKey, lang: Language = 'uz'): string => {
  return translations[lang][key] || key;
};
