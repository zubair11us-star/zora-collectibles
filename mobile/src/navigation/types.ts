import { NavigatorScreenParams } from "@react-navigation/native";

import { CategoryKey } from "@/types/models";

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  ItemDetails: { itemId: string };
  ItemEdit: {
    itemId?: string;
    categoryHint?: CategoryKey;
    initialName?: string;
    fulfillsWishlistId?: string;
  };
  ScanOptions: undefined;
  CameraScan: { categoryHint?: CategoryKey };
  BarcodeScan: undefined;
  IdentificationResult: undefined;
  PhotoUpload: { categoryHint?: CategoryKey };
  Locations: undefined;
  Settings: undefined;
  Transactions: undefined;
  AddTransaction: { itemId: string; itemName: string };
  WishlistEdit: { wishlistId?: string };
  ReceiptScan: { itemId?: string };
  Account: undefined;
  ImportExport: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Collection: { categoryKey?: CategoryKey } | undefined;
  ScanTab: undefined;
  Wishlist: undefined;
  More: undefined;
};
