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
    logout: 'Chiqish',
    userInfo: 'Foydalanuvchi ma\'lumotlari',
    
    // Common
    save: 'Saqlash',
    cancel: 'Bekor',
    delete: 'O\'chirish',
    back: 'Orqaga',
    close: 'Yopish',
    loading: 'Yuklanmoqda...',
    error: 'Xatolik',
    success: 'Muvaffaqiyatli',
    search: 'Qidirish...',
    empty: 'Bo\'sh',
    confirm: 'Tasdiqlash',
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
    logout: 'Выход',
    userInfo: 'Информация о пользователе',
    
    // Common
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    back: 'Назад',
    close: 'Закрыть',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    search: 'Поиск...',
    empty: 'Пусто',
    confirm: 'Подтвердить',
  },
};

export const t = (key: string, lang: Language = 'uz'): string => {
  return translations[lang][key as keyof typeof translations.uz] || key;
};