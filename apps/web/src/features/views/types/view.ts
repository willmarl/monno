export interface View {
  recorded: boolean;
  viewCount: number;
}

export interface ViewInput {
  resourceType: string;
  resourceId: number;
}
