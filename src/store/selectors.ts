import { useShallow } from "zustand/react/shallow";

import { useStore } from "./index";

export const useProductsScreenStore = () =>
  useStore(
    useShallow((state) => ({
      products: state.products,
      loadProducts: state.loadProducts,
      createProduct: state.createProduct,
      updateProduct: state.updateProduct,
      deleteProduct: state.deleteProduct,
      searchProducts: state.searchProducts,
      showToast: state.showToast,
    })),
  );

export const useInventoryScreenStore = () =>
  useStore(
    useShallow((state) => ({
      currentInventory: state.currentInventory,
      loadInventoryByDate: state.loadInventoryByDate,
      loadProducts: state.loadProducts,
      setCurrentQuantity: state.setCurrentQuantity,
      showToast: state.showToast,
      isLoading: state.isLoading,
    })),
  );

export const useAppRefreshStore = () =>
  useStore(
    useShallow((state) => ({
      isLoading: state.isLoading,
      refreshAppData: state.refreshAppData,
      showToast: state.showToast,
    })),
  );

export const useRatingScreenStore = () =>
  useStore(
    useShallow((state) => ({
      loadProducts: state.loadProducts,
      loadSnapshots: state.loadSnapshots,
      products: state.products,
      snapshots: state.snapshots,
    })),
  );

export const useStatisticsScreenStore = () =>
  useStore(
    useShallow((state) => ({
      getStatistics: state.getStatistics,
      loadProducts: state.loadProducts,
      loadSnapshots: state.loadSnapshots,
      products: state.products,
      snapshots: state.snapshots,
    })),
  );

export const useAuthStore = () =>
  useStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      logout: state.logout,
    })),
  );
