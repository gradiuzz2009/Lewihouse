import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AppNotification_Key {
  id: string;
  __typename?: 'AppNotification_Key';
}

export interface BillingInvoice_Key {
  id: string;
  __typename?: 'BillingInvoice_Key';
}

export interface ChatMessage_Key {
  id: string;
  __typename?: 'ChatMessage_Key';
}

export interface CreateMaintenanceTicketData {
  maintenanceTicket_insert: MaintenanceTicket_Key;
}

export interface CreateMaintenanceTicketVariables {
  roomNumber: string;
  residentId: string;
  residentName: string;
  title: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  reportedDate?: string | null;
}

export interface CreateResidentData {
  residentProfile_insert: ResidentProfile_Key;
}

export interface CreateResidentVariables {
  fullName: string;
  email: string;
  phone: string;
  roomNumber: string;
  moveInDate?: string | null;
  leaseEndDate?: string | null;
  monthlyRent?: number | null;
  depositAmount?: number | null;
  status: string;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
}

export interface CreateRoomData {
  roomUnit_insert: RoomUnit_Key;
}

export interface CreateRoomVariables {
  roomNumber: string;
  floor: string;
  wing?: string | null;
  roomType: string;
  capacity: number;
  monthlyPrice: number;
  deposit: number;
  status: string;
  notes?: string | null;
}

export interface ElectricityMeter_Key {
  id: string;
  __typename?: 'ElectricityMeter_Key';
}

export interface ListElectricityMetersData {
  electricityMeters: ({
    id: string;
    roomNumber: string;
    meterNumber: string;
    currentKwh: number;
    lastUpdated?: TimestampString | null;
  } & ElectricityMeter_Key)[];
}

export interface ListInvoicesData {
  billingInvoices: ({
    id: string;
    residentId: string;
    roomNumber: string;
    invoiceNumber: string;
    amount: number;
    paidAmount?: number | null;
    period?: string | null;
    status: string;
    dueDate?: string | null;
    paymentMethod?: string | null;
    receiptRef?: string | null;
    notes?: string | null;
  } & BillingInvoice_Key)[];
}

export interface ListMaintenanceTicketsData {
  maintenanceTickets: ({
    id: string;
    roomNumber: string;
    residentId: string;
    residentName: string;
    title: string;
    category: string;
    description: string;
    priority: string;
    status: string;
    reportedDate?: string | null;
    assignedTechnician?: string | null;
    notes?: string | null;
  } & MaintenanceTicket_Key)[];
}

export interface ListResidentsData {
  residentProfiles: ({
    id: string;
    fullName: string;
    email: string;
    phone: string;
    roomNumber: string;
    moveInDate?: string | null;
    leaseEndDate?: string | null;
    monthlyRent?: number | null;
    depositAmount?: number | null;
    status: string;
    emergencyContact?: string | null;
    emergencyPhone?: string | null;
  } & ResidentProfile_Key)[];
}

export interface ListRoomsData {
  roomUnits: ({
    id: string;
    roomNumber: string;
    floor: string;
    wing?: string | null;
    roomType: string;
    capacity: number;
    monthlyPrice: number;
    deposit: number;
    status: string;
    notes?: string | null;
    updatedAt?: TimestampString | null;
  } & RoomUnit_Key)[];
}

export interface MaintenanceTicket_Key {
  id: string;
  __typename?: 'MaintenanceTicket_Key';
}

export interface Property_Key {
  id: string;
  __typename?: 'Property_Key';
}

export interface ResidentProfile_Key {
  id: string;
  __typename?: 'ResidentProfile_Key';
}

export interface RoomUnit_Key {
  id: string;
  __typename?: 'RoomUnit_Key';
}

export interface SendChatMessageData {
  chatMessage_insert: ChatMessage_Key;
}

export interface SendChatMessageVariables {
  tenantId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
}

interface CreateRoomRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateRoomVariables): MutationRef<CreateRoomData, CreateRoomVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateRoomVariables): MutationRef<CreateRoomData, CreateRoomVariables>;
  operationName: string;
}
export const createRoomRef: CreateRoomRef;

export function createRoom(vars: CreateRoomVariables): MutationPromise<CreateRoomData, CreateRoomVariables>;
export function createRoom(dc: DataConnect, vars: CreateRoomVariables): MutationPromise<CreateRoomData, CreateRoomVariables>;

interface CreateResidentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateResidentVariables): MutationRef<CreateResidentData, CreateResidentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateResidentVariables): MutationRef<CreateResidentData, CreateResidentVariables>;
  operationName: string;
}
export const createResidentRef: CreateResidentRef;

export function createResident(vars: CreateResidentVariables): MutationPromise<CreateResidentData, CreateResidentVariables>;
export function createResident(dc: DataConnect, vars: CreateResidentVariables): MutationPromise<CreateResidentData, CreateResidentVariables>;

interface CreateMaintenanceTicketRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMaintenanceTicketVariables): MutationRef<CreateMaintenanceTicketData, CreateMaintenanceTicketVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateMaintenanceTicketVariables): MutationRef<CreateMaintenanceTicketData, CreateMaintenanceTicketVariables>;
  operationName: string;
}
export const createMaintenanceTicketRef: CreateMaintenanceTicketRef;

export function createMaintenanceTicket(vars: CreateMaintenanceTicketVariables): MutationPromise<CreateMaintenanceTicketData, CreateMaintenanceTicketVariables>;
export function createMaintenanceTicket(dc: DataConnect, vars: CreateMaintenanceTicketVariables): MutationPromise<CreateMaintenanceTicketData, CreateMaintenanceTicketVariables>;

interface SendChatMessageRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SendChatMessageVariables): MutationRef<SendChatMessageData, SendChatMessageVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SendChatMessageVariables): MutationRef<SendChatMessageData, SendChatMessageVariables>;
  operationName: string;
}
export const sendChatMessageRef: SendChatMessageRef;

export function sendChatMessage(vars: SendChatMessageVariables): MutationPromise<SendChatMessageData, SendChatMessageVariables>;
export function sendChatMessage(dc: DataConnect, vars: SendChatMessageVariables): MutationPromise<SendChatMessageData, SendChatMessageVariables>;

interface ListRoomsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRoomsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListRoomsData, undefined>;
  operationName: string;
}
export const listRoomsRef: ListRoomsRef;

export function listRooms(options?: ExecuteQueryOptions): QueryPromise<ListRoomsData, undefined>;
export function listRooms(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRoomsData, undefined>;

interface ListResidentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListResidentsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListResidentsData, undefined>;
  operationName: string;
}
export const listResidentsRef: ListResidentsRef;

export function listResidents(options?: ExecuteQueryOptions): QueryPromise<ListResidentsData, undefined>;
export function listResidents(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListResidentsData, undefined>;

interface ListInvoicesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListInvoicesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListInvoicesData, undefined>;
  operationName: string;
}
export const listInvoicesRef: ListInvoicesRef;

export function listInvoices(options?: ExecuteQueryOptions): QueryPromise<ListInvoicesData, undefined>;
export function listInvoices(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListInvoicesData, undefined>;

interface ListMaintenanceTicketsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMaintenanceTicketsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMaintenanceTicketsData, undefined>;
  operationName: string;
}
export const listMaintenanceTicketsRef: ListMaintenanceTicketsRef;

export function listMaintenanceTickets(options?: ExecuteQueryOptions): QueryPromise<ListMaintenanceTicketsData, undefined>;
export function listMaintenanceTickets(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMaintenanceTicketsData, undefined>;

interface ListElectricityMetersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListElectricityMetersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListElectricityMetersData, undefined>;
  operationName: string;
}
export const listElectricityMetersRef: ListElectricityMetersRef;

export function listElectricityMeters(options?: ExecuteQueryOptions): QueryPromise<ListElectricityMetersData, undefined>;
export function listElectricityMeters(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListElectricityMetersData, undefined>;

