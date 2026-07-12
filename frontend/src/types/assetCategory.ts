export type CustomFieldType = "text" | "number" | "date" | "boolean";

export interface CustomFieldDef {
  key: string;
  label: string;
  type: CustomFieldType;
}

export interface AssetCategory {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  icon: string | null;
  customFieldsSchema: CustomFieldDef[] | null;
  createdAt: string;
  updatedAt: string;
  _count?: { assets: number };
}

export interface CreateAssetCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  customFieldsSchema?: CustomFieldDef[];
}

export type UpdateAssetCategoryInput = Partial<CreateAssetCategoryInput>;
