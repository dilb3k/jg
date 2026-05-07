import { useCallback } from "react";
import { useThemeStore } from "../store/themeStore";

export type Language = "uz" | "ru";

export const translations = {
  uz: {
    // Auth
    login: "Kirish",
    username: "Login",
    password: "Parol",
    loginPlaceholder: "Loginingizni kiriting",
    passwordPlaceholder: "Parolingizni kiriting",
    loginError: "Login xatoligi",
    noAccount: "Hisobingiz yo'qmi? Administratorga murojaat qiling",
    enterLoginPassword: "Login va parolni kiriting",
    signIn: "Kirish",

    // Navigation
    main: "Asosiy",
    inventory: "Ombor",
    statistics: "Statistika",
    users: "Foydalanuvchilar",

    // Products
    products: "Mahsulotlar",
    addProduct: "Yangi mahsulot",
    editProduct: "Mahsulotni tahrirlash",
    productName: "Mahsulot nomi",
    buyPrice: "Kelish narxi",
    sellPrice: "Sotish narxi",
    quantity: "Joriy qoldiq",
    noProducts: "Mahsulotlar hali qo'shilmagan",
    productSaved: "Mahsulot saqlandi",
    productDeleted: "Mahsulot o'chirildi",
    deleteConfirm: "Mahsulot o'chirilsinmi?",
    deleteMessage:
      "Bu mahsulot yangi ro'yxatlarda ko'rinmaydi. Tarixiy ma'lumotlar saqlanib qoladi.",
    productInfoIncorrect: "Mahsulot ma'lumoti noto'g'ri",
    barrelManagement: "Barrel Management",
    signInToSystem: "Tizimga kiring",

    // Products (ProductsScreen)
    noImage: "Rasm yo'q",
    currentQuantity: "Joriy qoldiq",
    productNamePlaceholder: "Masalan: Cola 1L",
    pricePlaceholder: "0",
    quantityPlaceholder: "0",
    addImage: "Rasm qo'shish",
    important: "Hisob-kitob uchun muhim",
    price_qty_warning:
      "Narx va miqdor noto'g'ri kiritilsa keyingi hisoblarda chalkashlik yuz beradi. Shu sabab manfiy miqdor, 0 narx va zararli sotuv avtomatik bloklanadi.",
    edit_product_warning:
      "Bu yerda mahsulotning real qoldig'i yuradi. Mahsulot kelsa yoki soni oshsa shu yerdan yangilang, ombor sahifasi ham shunga moslashadi.",

    // Restock
    restock: "Qo'shish",
    restockSubtitle:
      "Mahsulot kelganda qoldiqni yangilash uchun ro'yxatdan tanlang",
    howMuchArrived: "Qancha mahsulot keldi?",
    currentStock: "Hozirgi qoldiq",
    addToStock: "Qo'shiladi",
    newStock: "Yangi qoldiq",
    addStock: "Qo'shish",
    addingStock: "Qo'shilmoqda...",
    stockAdded: "dona qo'shildi. Jami:",
    stockInfo: "Qoldiq: {quantity} dona",
    restockInfo:
      "Bu yerda faqat mahsulot miqdorini oshirasiz. Yangi kelgan mahsulot miqdorini kiriting, tizim avtomatik ravishda umumiy qoldiqni yangilaydi.",
    enterValidQuantity: "To'g'ri miqdorni kiriting",
    result: "Natija",
    buy: "Kelish",
    sell: "Sotish",
    add: "Qo'shish",

    // Inventory
    start: "Boshlang'ich",
    startQuantity: "Boshlang'ich miqdor",
    currentQuantityInv: "Joriy miqdor",
    sold: "Sotilgan",
    remaining: "Qoldiq",
    revenue: "Tushum",
    profit: "Foyda",
    stockValue: "Qoldiq qiymati",
    readOnly: "Faqat ko'rish",
    futureDate: "Kelajak sana",
    pastDateError: "O'tgan kunlar uchun o'zgartirish kiritib bo'lmaydi!",
    cannotBeLessThan: "Boshlang'ich miqdor",
    cannotBeLessThanSuffix: "tadan kam bo'lolmaydi",
    alreadySold: "allaqachon sotilgan",
    unitProfit: "Birlik foyda",
    potentialProfit: "Qolgan potensial foyda",
    totalPotentialProfit: "Jami mumkin bo'lgan foyda",
    progress: "Progress",
    inventoryUpdated: "Ombor qoldig'i yangilandi",
    saveError: "Saqlashda xatolik yuz berdi",
    cannotIncreaseStock:
      "Joriy qoldiqni oshirib bo'lmaydi. Mahsulot qo'shish mahsulotlar sahifasidan qilinadi",
    inventoryInfo:
      "Omborda faqat real qoldiq kiritiladi. Sotilgan miqdor avtomatik hisoblanadi. Mahsulot kelsa, mahsulotlar sahifasidan qoldiqni oshiring.",
    readOnlyMode: "Ko'rish rejimi",
    startQtyAuto:
      "Boshlang'ich miqdor avtomatik. Uni ombordan o'zgartirib bo'lmaydi.",
    autoHint: "Avtomatik hisoblangan",
    todayStart: "Bugungi boshlang'ich",
    currentInventory: "Ombor qoldig'i",
    preSaveCheck: "Saqlashdan oldingi tekshiruv",
    expectedRevenue: "Kutilgan tushum",
    expectedProfit: "Kutilgan foyda",
    previousSold: "Avval sotilgan",
    newSold: "Yangi sotilgan",
    warning_qtyAdjust:
      "Omborda qoldiqni faqat kamaytirasiz. Mahsulot kelsa, mahsulotlar sahifasidan qoldiqni ko'paytiring.",
    loadingInventory: "Ombor ma'lumotlari yuklanmoqda...",
    notAvailableYet: "Hali mavjud emas",
    end: "Tugash",
    futureDateNotice: "Kelajak kuni yopiq",
    futureDateNoticeText:
      "Bu sana hali kelmagan, shuning uchun inventarizatsiya va savdo hisoblari amalga oshirilmaydi.",
    ratingNoData: "Reyting uchun ma'lumot topilmadi",
    addProductsFirst: "Avval mahsulot qo'shing",
    noProductsFound: "Mahsulotlar topilmadi",
    emptyNoData: "Ma'lumot yo'q",

    // Statistics
    daily: "Kun",
    weekly: "Hafta",
    monthly: "Oy",
    yearly: "Yil",
    selectPeriodDate: "Davr sanasini tanlang",
    selectStartDate: "Boshlanish sanasini tanlang",
    selectEndDate: "Tugash sanasini tanlang",
    selectDateHint: "Davr sanasini tanlash",
    totalRevenue: "Tushum",
    totalProfit: "Sof foyda",
    totalSold: "Sotildi",
    margin: "Marja",
    topProducts: "Eng ko'p sotilgan mahsulotlar",
    periodSales: "Davrga savdo",
    noData: "Ma'lumot yo'q",
    dataRefreshed: "Ma'lumotlar yangilandi",
    refreshError: "Yangilashda xatolik yuz berdi",
    noSalesPeriod:
      "Bu davrda hali savdo yo'q, shuning uchun qiymatlar 0 ko'rsatildi.",
    noProductsPeriod: "Tanlangan davr bo'yicha mahsulot ma'lumoti yo'q",

    // Statistics - Additional
    totalRevenueLabel: "Jami tushum",
    mainKPI: "Asosiy KPI",
    soldPieces: "Sotilgan dona",
    totalSellablePieces: "Jami sotiladigan dona",
    netProfit: "Sof foyda",
    marginPercent: "Marja",
    topProductsLabel: "Eng ko'p sotilgan mahsulotlar",
    periodSalesLabel: "Davrga savdo",
    profitInsight: "Foyda tahlili",
    earningsSoFar: "Hozirgacha daromad",
    remainingPotentialProfit: "Qolgan potensial foyda",
    totalPotential: "Jami mumkin bo'lgan foyda",
    ranging_overall: "Barcha vaqtdagi umumiy holat",
    soldPiecesLabel: "Jami sotiladigan dona",
    soldItemsLabel: "Sotilgan dona",
    totalSellValue: "Jami sotish qiymati",
    soldValue: "Sotilgan qiymat",
    totalStockValue: "Qolgan qiymat",
    earnedProfit: "Olingan foyda",
    profitEarned: "Olingan foyda",
    remainingPieces: "Qolgan dona",
    remainingStockValue: "Qolgan qiymat",
    all_data: "Barcha ma'lumotlar",
    from_beginning: "Boshidan",
    until_now: "Hozirgacha",

    // Rating
    rating: "Reyting",
    date: "Sana",
    allTimeRating: "Barcha vaqt reytingi",
    defaultRating: "Default holat: barcha ma'lumotlar bo'yicha reyting",
    ratingForDate: "kundagi reyting",
    profitPerUnit: "Birlik foyda",
    totalProfitRating: "Jami foyda",
    leastSold: "Kam sotilgan",

    // Users/Admins
    usersTitle: "Adminlar",
    createUser: "Yangi admin",
    userCreated: "Admin yaratildi",
    userRole: "Rol",
    superAdmin: "Super Admin",
    admin: "Admin",
    createdAt: "Yaratilgan",
    errorLoadingAdmins: "Adminlarni yuklashda xatolik",
    createUserError: "Admin yaratishda xatolik",
    createAdmin: "Yangi admin yaratish",
    importantInfo: "Muhim ma'lumot",
    adminInfo:
      "Yangi admin faqat mahsulot va ombor bilan ishlay oladi. Adminlar ro'yxatini faqat superAdmin ko'ra oladi.",
    loginPlaceholder_Admin: "Admin loginini kiriting",
    passwordPlaceholder_Admin: "Parolni kiriting (kamida 6 belgi)",
    passwordLength: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
    confirmCreate: "Yaratish",

    // Settings
    settings: "Sozlamalar",
    language: "Til",
    theme: "Mavzu",
    light: "Yorug'",
    dark: "Tungi",
    system: "Tizim",
    lang_uz: "O'zbek",
    lang_ru: "Русский",
    logout: "Chiqish",
    userInfo: "Foydalanuvchi ma'lumotlari",
    close: "Yopish",
    connectionMode: "Ulanish rejimi",
    onlineMode: "Onlayn rejim",
    offlineMode: "Oflayn rejim",
    onlineModeDesc: "Barcha ma'lumotlar serverdan yuklanadi",
    offlineModeDesc: "Ma'lumotlar lokal saqlashdan o'qiladi",

    // Common
    save: "Saqlash",
    cancel: "Bekor",
    delete: "O'chirish",
    back: "Orqaga",
    loading: "Yuklanmoqda...",
    error: "Xatolik",
    success: "Muvaffaqiyatli",
    search: "Qidirish...",
    empty: "Bo'sh",
    confirm: "Tasdiqlash",
    online: "Online",
    offline: "Offline",
    syncPending: "Sinxdan o'tishi kerak",
    syncing: "Sinxdan o'tmoqda...",
    syncComplete: "Sinx yakunlandi",
    syncError: "Sinx bajarilmadi",
    initializationError: "Boshlashda xatolik yuz berdi",
    productLoadError: "Mahsulotlar yuklanmadi",
    inventoryLoadError: "Ombor ma'lumotlari yuklanmadi",
    snapshotLoadError: "Snapshotlar yuklanmadi",
  },

  ru: {
    // Auth
    login: "Вход",
    username: "Логин",
    password: "Пароль",
    loginPlaceholder: "Введите логин",
    passwordPlaceholder: "Введите пароль",
    loginError: "Ошибка входа",
    noAccount: "Нет аккаунта? Обратитесь к администратору",
    enterLoginPassword: "Введите логин и пароль",
    signIn: "Войти",

    // Navigation
    main: "Главная",
    inventory: "Склад",
    statistics: "Статистика",
    users: "Пользователи",

    // Products
    products: "Продукты",
    addProduct: "Новый продукт",
    editProduct: "Редактировать продукт",
    productName: "Название продукта",
    buyPrice: "Закупочная цена",
    sellPrice: "Цена продажи",
    quantity: "Текущий остаток",
    noProducts: "Продукты еще не добавлены",
    productSaved: "Продукт сохранен",
    productDeleted: "Продукт удален",
    deleteConfirm: "Удалить продукт?",
    deleteMessage:
      "Этот продукт не будет отображаться в новых списках. Исторические данные сохранятся.",
    productInfoIncorrect: "Информация о продукте неверна",
    barrelManagement: "Barrel Management",
    signInToSystem: "Войти в систему",

    // Products (ProductsScreen)
    noImage: "Изображение отсутствует",
    currentQuantity: "Текущий остаток",
    productNamePlaceholder: "Например: Cola 1L",
    pricePlaceholder: "0",
    quantityPlaceholder: "0",
    addImage: "Добавить изображение",
    important: "Важно для расчетов",
    price_qty_warning:
      "Неверные данные о цене или количестве приведут к путанице в будущих расчетах. Поэтому отрицательное количество, цена 0 и убыточные продажи автоматически блокируются.",
    edit_product_warning:
      "Здесь находится реальный остаток товара. Если товар поступил или количество увеличилось, обновляйте здесь, страница склада также будет синхронизирована.",

    // Restock
    restock: "Пополнение",
    restockSubtitle:
      "Выберите из списка для обновления остатка при поступлении товара",
    howMuchArrived: "Сколько товара прибыло?",
    currentStock: "Текущий остаток",
    addToStock: "Добавить",
    newStock: "Новый остаток",
    addStock: "Добавить",
    addingStock: "Добавление...",
    stockAdded: "штук добавлено. Всего:",
    stockInfo: "Остаток: {quantity} шт",
    restockInfo:
      "Здесь вы можете только увеличить количество товара. Введите количество поступившего товара, система автоматически обновит общий остаток.",
    enterValidQuantity: "Введите правильное количество",
    result: "Результат",
    buy: "Закупочная",
    sell: "Продажа",
    add: "Добавить",
    loadingInventory: "Данные об остатках загружаются...",
    notAvailableYet: "Еще не доступно",

    // Inventory
    start: "Начальное",
    startQuantity: "Начальное количество",
    currentQuantityInv: "Текущее количество",
    sold: "Продано",
    remaining: "Остаток",
    revenue: "Выручка",
    profit: "Прибыль",
    stockValue: "Стоимость остатка",
    readOnly: "Только просмотр",
    futureDate: "Будущая дата",
    pastDateError: "Нельзя вносить изменения за прошедшие дни!",
    cannotBeLessThan: "Начальное количество не может быть меньше",
    cannotBeLessThanSuffix: "штук",
    alreadySold: "уже продано",
    unitProfit: "Прибыль с единицы",
    potentialProfit: "Оставшаяся потенциальная прибыль",
    totalPotentialProfit: "Общая потенциальная прибыль",
    progress: "Прогресс",
    inventoryUpdated: "Остаток на складе обновлен",
    saveError: "Ошибка при сохранении",
    cannotIncreaseStock:
      "Нельзя увеличить текущий остаток. Добавление товара осуществляется на странице продуктов.",
    inventoryInfo:
      "На складе вносится только фактический остаток. Проданное количество рассчитывается автоматически. При поступлении товара увеличивайте остаток на странице продуктов.",
    readOnlyMode: "Режим просмотра",
    startQtyAuto:
      "Начальное количество автоматически. Его нельзя изменить на складе.",
    autoHint: "Автоматически рассчитано",
    todayStart: "Начальное на сегодня",
    currentInventory: "Остаток на складе",
    preSaveCheck: "Проверка перед сохранением",
    expectedRevenue: "Ожидаемая выручка",
    expectedProfit: "Ожидаемая прибыль",
    previousSold: "Ранее продано",
    newSold: "Новые продажи",
    warning_qtyAdjust:
      "На складе можно только уменьшать остаток. При поступлении товара увеличивайте остаток на странице продуктов.",
    end: "Конец",
    futureDateNotice: "Будущий день закрыт",
    futureDateNoticeText:
      "Эта дата еще не наступила, поэтому инвентаризация и расчет продаж не производятся.",
    ratingNoData: "Данные для рейтинга не найдены",
    addProductsFirst: "Сначала добавьте продукты",
    noProductsFound: "Продукты не найдены",
    emptyNoData: "Нет данных",

    // Statistics
    daily: "День",
    weekly: "Неделя",
    monthly: "Месяц",
    yearly: "Год",
    selectPeriodDate: "Выберите дату периода",
    selectStartDate: "Выберите начальную дату",
    selectEndDate: "Выберите конечную дату",
    selectDateHint: "Выбор даты периода",
    totalRevenue: "Выручка",
    totalProfit: "Чистая прибыль",
    totalSold: "Продано",
    margin: "Маржа",
    topProducts: "Самые продаваемые продукты",
    periodSales: "Продажи за период",
    noData: "Нет данных",
    dataRefreshed: "Данные обновлены",
    refreshError: "Ошибка обновления",
    noSalesPeriod:
      "В этом периоде еще не было продаж, поэтому значения показаны как 0.",
    noProductsPeriod: "Нет данных о продуктах за выбранный период",

    // Statistics - Additional
    totalRevenueLabel: "Общий доход",
    mainKPI: "Основной KPI",
    soldPieces: "Продано штук",
    totalSellablePieces: "Всего доступно для продажи",
    netProfit: "Чистая прибыль",
    marginPercent: "Маржа",
    topProductsLabel: "Самые продаваемые продукты",
    periodSalesLabel: "Продажи за период",
    profitInsight: "Анализ прибыли",
    earningsSoFar: "Доход на данный момент",
    remainingPotentialProfit: "Остающаяся потенциальная прибыль",
    totalPotential: "Общая потенциальная прибыль",
    ranging_overall: "Общее состояние за все время",
    soldPiecesLabel: "Всего продаваемых штук",
    soldItemsLabel: "Продано штук",
    totalSellValue: "Общая стоимость продаж",
    soldValue: "Стоимость проданных товаров",
    totalStockValue: "Остаточная стоимость",
    earnedProfit: "Полученная прибыль",
    profitEarned: "Полученная прибыль",
    remainingPieces: "Остаток шт",
    remainingStockValue: "Остаточная стоимость",
    all_data: "Все данные",
    from_beginning: "С начала",
    until_now: "По настоящее время",

    // Rating
    rating: "Рейтинг",
    date: "Дата",
    allTimeRating: "Рейтинг за все время",
    defaultRating: "По умолчанию: рейтинг по всем данным",
    ratingForDate: "кундаги рейтинг",
    profitPerUnit: "Прибыль с единицы",
    totalProfitRating: "Общая прибыль",
    leastSold: "Меньше всего продано",

    // Users/Admins
    usersTitle: "Админы",
    createUser: "Новый админ",
    userCreated: "Админ создан",
    userRole: "Роль",
    superAdmin: "Супер Админ",
    admin: "Админ",
    createdAt: "Создан",
    errorLoadingAdmins: "Ошибка загрузки администраторов",
    createUserError: "Ошибка создания администратора",
    createAdmin: "Создать нового администратора",
    importantInfo: "Важная информация",
    adminInfo:
      "Новый админ может работать только с продуктами и складом. Список админов видит только супер-админ.",
    loginPlaceholder_Admin: "Введите логин администратора",
    passwordPlaceholder_Admin: "Введите пароль (минимум 6 символов)",
    passwordLength: "Пароль должен содержать минимум 6 символов",
    confirmCreate: "Создать",

    // Settings
    settings: "Настройки",
    language: "Язык",
    theme: "Тема",
    light: "Светлая",
    dark: "Тёмная",
    system: "Системная",
    lang_uz: "Узбекский",
    lang_ru: "Русский",
    logout: "Выход",
    userInfo: "Информация о пользователе",
    close: "Закрыть",
    connectionMode: "Режим подключения",
    onlineMode: "Онлайн режим",
    offlineMode: "Офлайн режим",
    onlineModeDesc: "Все данные загружаются с сервера",
    offlineModeDesc: "Данные читаются из локального хранилища",

    // Common
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    back: "Назад",
    loading: "Загрузка...",
    error: "Ошибка",
    success: "Успешно",
    search: "Поиск...",
    empty: "Пусто",
    confirm: "Подтвердить",
    online: "Онлайн",
    offline: "Офлайн",
    syncPending: "Требуется синхронизация",
    syncing: "Синхронизация...",
    syncComplete: "Синхронизация завершена",
    syncError: "Ошибка синхронизации",
    initializationError: "Ошибка инициализации",
    productLoadError: "Не удалось загрузить продукты",
    inventoryLoadError: "Не удалось загрузить данные склада",
    snapshotLoadError: "Не удалось загрузить снимки",
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
   * Translate a key to the current language with optional parameters
   */
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, any>): string => {
      let text = translations[language][key] || key;

      if (params) {
        Object.keys(params).forEach((paramKey) => {
          const placeholder = `{${paramKey}}`;
          text = text.replace(
            new RegExp(placeholder, "g"),
            String(params[paramKey]),
          );
        });
      }

      return text;
    },
    [language],
  );

  /**
   * Set the language and persist to storage
   */
  const setLanguage = useCallback(
    async (newLanguage: Language) => {
      await setLanguageFromStore(newLanguage);
    },
    [setLanguageFromStore],
  );

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
export const translate = (
  key: TranslationKey,
  lang: Language = "uz",
  params?: Record<string, any>,
): string => {
  let text = translations[lang][key] || key;

  if (params) {
    Object.keys(params).forEach((paramKey) => {
      const placeholder = `{${paramKey}}`;
      text = text.replace(
        new RegExp(placeholder, "g"),
        String(params[paramKey]),
      );
    });
  }

  return text;
};
