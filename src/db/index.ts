export const initDatabase = async (): Promise<void> => {
  return Promise.resolve();
};

export const getDatabase = () => ({ init: initDatabase });
export const closeDatabase = async (): Promise<void> => {};
