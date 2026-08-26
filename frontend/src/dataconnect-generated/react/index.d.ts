import { CreateRoomData, CreateRoomVariables, CreateResidentData, CreateResidentVariables, CreateMaintenanceTicketData, CreateMaintenanceTicketVariables, SendChatMessageData, SendChatMessageVariables, ListRoomsData, ListResidentsData, ListInvoicesData, ListMaintenanceTicketsData, ListElectricityMetersData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateRoom(options?: useDataConnectMutationOptions<CreateRoomData, FirebaseError, CreateRoomVariables>): UseDataConnectMutationResult<CreateRoomData, CreateRoomVariables>;
export function useCreateRoom(dc: DataConnect, options?: useDataConnectMutationOptions<CreateRoomData, FirebaseError, CreateRoomVariables>): UseDataConnectMutationResult<CreateRoomData, CreateRoomVariables>;

export function useCreateResident(options?: useDataConnectMutationOptions<CreateResidentData, FirebaseError, CreateResidentVariables>): UseDataConnectMutationResult<CreateResidentData, CreateResidentVariables>;
export function useCreateResident(dc: DataConnect, options?: useDataConnectMutationOptions<CreateResidentData, FirebaseError, CreateResidentVariables>): UseDataConnectMutationResult<CreateResidentData, CreateResidentVariables>;

export function useCreateMaintenanceTicket(options?: useDataConnectMutationOptions<CreateMaintenanceTicketData, FirebaseError, CreateMaintenanceTicketVariables>): UseDataConnectMutationResult<CreateMaintenanceTicketData, CreateMaintenanceTicketVariables>;
export function useCreateMaintenanceTicket(dc: DataConnect, options?: useDataConnectMutationOptions<CreateMaintenanceTicketData, FirebaseError, CreateMaintenanceTicketVariables>): UseDataConnectMutationResult<CreateMaintenanceTicketData, CreateMaintenanceTicketVariables>;

export function useSendChatMessage(options?: useDataConnectMutationOptions<SendChatMessageData, FirebaseError, SendChatMessageVariables>): UseDataConnectMutationResult<SendChatMessageData, SendChatMessageVariables>;
export function useSendChatMessage(dc: DataConnect, options?: useDataConnectMutationOptions<SendChatMessageData, FirebaseError, SendChatMessageVariables>): UseDataConnectMutationResult<SendChatMessageData, SendChatMessageVariables>;

export function useListRooms(options?: useDataConnectQueryOptions<ListRoomsData>): UseDataConnectQueryResult<ListRoomsData, undefined>;
export function useListRooms(dc: DataConnect, options?: useDataConnectQueryOptions<ListRoomsData>): UseDataConnectQueryResult<ListRoomsData, undefined>;

export function useListResidents(options?: useDataConnectQueryOptions<ListResidentsData>): UseDataConnectQueryResult<ListResidentsData, undefined>;
export function useListResidents(dc: DataConnect, options?: useDataConnectQueryOptions<ListResidentsData>): UseDataConnectQueryResult<ListResidentsData, undefined>;

export function useListInvoices(options?: useDataConnectQueryOptions<ListInvoicesData>): UseDataConnectQueryResult<ListInvoicesData, undefined>;
export function useListInvoices(dc: DataConnect, options?: useDataConnectQueryOptions<ListInvoicesData>): UseDataConnectQueryResult<ListInvoicesData, undefined>;

export function useListMaintenanceTickets(options?: useDataConnectQueryOptions<ListMaintenanceTicketsData>): UseDataConnectQueryResult<ListMaintenanceTicketsData, undefined>;
export function useListMaintenanceTickets(dc: DataConnect, options?: useDataConnectQueryOptions<ListMaintenanceTicketsData>): UseDataConnectQueryResult<ListMaintenanceTicketsData, undefined>;

export function useListElectricityMeters(options?: useDataConnectQueryOptions<ListElectricityMetersData>): UseDataConnectQueryResult<ListElectricityMetersData, undefined>;
export function useListElectricityMeters(dc: DataConnect, options?: useDataConnectQueryOptions<ListElectricityMetersData>): UseDataConnectQueryResult<ListElectricityMetersData, undefined>;
