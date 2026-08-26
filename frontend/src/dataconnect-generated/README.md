# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListRooms*](#listrooms)
  - [*ListResidents*](#listresidents)
  - [*ListInvoices*](#listinvoices)
  - [*ListMaintenanceTickets*](#listmaintenancetickets)
  - [*ListElectricityMeters*](#listelectricitymeters)
- [**Mutations**](#mutations)
  - [*CreateRoom*](#createroom)
  - [*CreateResident*](#createresident)
  - [*CreateMaintenanceTicket*](#createmaintenanceticket)
  - [*SendChatMessage*](#sendchatmessage)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListRooms
You can execute the `ListRooms` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listRooms(options?: ExecuteQueryOptions): QueryPromise<ListRoomsData, undefined>;

interface ListRoomsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRoomsData, undefined>;
}
export const listRoomsRef: ListRoomsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listRooms(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRoomsData, undefined>;

interface ListRoomsRef {
  ...
  (dc: DataConnect): QueryRef<ListRoomsData, undefined>;
}
export const listRoomsRef: ListRoomsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listRoomsRef:
```typescript
const name = listRoomsRef.operationName;
console.log(name);
```

### Variables
The `ListRooms` query has no variables.
### Return Type
Recall that executing the `ListRooms` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListRoomsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListRooms`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listRooms } from '@dataconnect/generated';


// Call the `listRooms()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listRooms();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listRooms(dataConnect);

console.log(data.roomUnits);

// Or, you can use the `Promise` API.
listRooms().then((response) => {
  const data = response.data;
  console.log(data.roomUnits);
});
```

### Using `ListRooms`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listRoomsRef } from '@dataconnect/generated';


// Call the `listRoomsRef()` function to get a reference to the query.
const ref = listRoomsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listRoomsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.roomUnits);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.roomUnits);
});
```

## ListResidents
You can execute the `ListResidents` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listResidents(options?: ExecuteQueryOptions): QueryPromise<ListResidentsData, undefined>;

interface ListResidentsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListResidentsData, undefined>;
}
export const listResidentsRef: ListResidentsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listResidents(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListResidentsData, undefined>;

interface ListResidentsRef {
  ...
  (dc: DataConnect): QueryRef<ListResidentsData, undefined>;
}
export const listResidentsRef: ListResidentsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listResidentsRef:
```typescript
const name = listResidentsRef.operationName;
console.log(name);
```

### Variables
The `ListResidents` query has no variables.
### Return Type
Recall that executing the `ListResidents` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListResidentsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListResidents`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listResidents } from '@dataconnect/generated';


// Call the `listResidents()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listResidents();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listResidents(dataConnect);

console.log(data.residentProfiles);

// Or, you can use the `Promise` API.
listResidents().then((response) => {
  const data = response.data;
  console.log(data.residentProfiles);
});
```

### Using `ListResidents`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listResidentsRef } from '@dataconnect/generated';


// Call the `listResidentsRef()` function to get a reference to the query.
const ref = listResidentsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listResidentsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.residentProfiles);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.residentProfiles);
});
```

## ListInvoices
You can execute the `ListInvoices` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listInvoices(options?: ExecuteQueryOptions): QueryPromise<ListInvoicesData, undefined>;

interface ListInvoicesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListInvoicesData, undefined>;
}
export const listInvoicesRef: ListInvoicesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listInvoices(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListInvoicesData, undefined>;

interface ListInvoicesRef {
  ...
  (dc: DataConnect): QueryRef<ListInvoicesData, undefined>;
}
export const listInvoicesRef: ListInvoicesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listInvoicesRef:
```typescript
const name = listInvoicesRef.operationName;
console.log(name);
```

### Variables
The `ListInvoices` query has no variables.
### Return Type
Recall that executing the `ListInvoices` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListInvoicesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListInvoices`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listInvoices } from '@dataconnect/generated';


// Call the `listInvoices()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listInvoices();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listInvoices(dataConnect);

console.log(data.billingInvoices);

// Or, you can use the `Promise` API.
listInvoices().then((response) => {
  const data = response.data;
  console.log(data.billingInvoices);
});
```

### Using `ListInvoices`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listInvoicesRef } from '@dataconnect/generated';


// Call the `listInvoicesRef()` function to get a reference to the query.
const ref = listInvoicesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listInvoicesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.billingInvoices);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.billingInvoices);
});
```

## ListMaintenanceTickets
You can execute the `ListMaintenanceTickets` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMaintenanceTickets(options?: ExecuteQueryOptions): QueryPromise<ListMaintenanceTicketsData, undefined>;

interface ListMaintenanceTicketsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMaintenanceTicketsData, undefined>;
}
export const listMaintenanceTicketsRef: ListMaintenanceTicketsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMaintenanceTickets(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMaintenanceTicketsData, undefined>;

interface ListMaintenanceTicketsRef {
  ...
  (dc: DataConnect): QueryRef<ListMaintenanceTicketsData, undefined>;
}
export const listMaintenanceTicketsRef: ListMaintenanceTicketsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMaintenanceTicketsRef:
```typescript
const name = listMaintenanceTicketsRef.operationName;
console.log(name);
```

### Variables
The `ListMaintenanceTickets` query has no variables.
### Return Type
Recall that executing the `ListMaintenanceTickets` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMaintenanceTicketsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListMaintenanceTickets`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMaintenanceTickets } from '@dataconnect/generated';


// Call the `listMaintenanceTickets()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMaintenanceTickets();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMaintenanceTickets(dataConnect);

console.log(data.maintenanceTickets);

// Or, you can use the `Promise` API.
listMaintenanceTickets().then((response) => {
  const data = response.data;
  console.log(data.maintenanceTickets);
});
```

### Using `ListMaintenanceTickets`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMaintenanceTicketsRef } from '@dataconnect/generated';


// Call the `listMaintenanceTicketsRef()` function to get a reference to the query.
const ref = listMaintenanceTicketsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMaintenanceTicketsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.maintenanceTickets);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.maintenanceTickets);
});
```

## ListElectricityMeters
You can execute the `ListElectricityMeters` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listElectricityMeters(options?: ExecuteQueryOptions): QueryPromise<ListElectricityMetersData, undefined>;

interface ListElectricityMetersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListElectricityMetersData, undefined>;
}
export const listElectricityMetersRef: ListElectricityMetersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listElectricityMeters(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListElectricityMetersData, undefined>;

interface ListElectricityMetersRef {
  ...
  (dc: DataConnect): QueryRef<ListElectricityMetersData, undefined>;
}
export const listElectricityMetersRef: ListElectricityMetersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listElectricityMetersRef:
```typescript
const name = listElectricityMetersRef.operationName;
console.log(name);
```

### Variables
The `ListElectricityMeters` query has no variables.
### Return Type
Recall that executing the `ListElectricityMeters` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListElectricityMetersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListElectricityMetersData {
  electricityMeters: ({
    id: string;
    roomNumber: string;
    meterNumber: string;
    currentKwh: number;
    lastUpdated?: TimestampString | null;
  } & ElectricityMeter_Key)[];
}
```
### Using `ListElectricityMeters`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listElectricityMeters } from '@dataconnect/generated';


// Call the `listElectricityMeters()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listElectricityMeters();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listElectricityMeters(dataConnect);

console.log(data.electricityMeters);

// Or, you can use the `Promise` API.
listElectricityMeters().then((response) => {
  const data = response.data;
  console.log(data.electricityMeters);
});
```

### Using `ListElectricityMeters`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listElectricityMetersRef } from '@dataconnect/generated';


// Call the `listElectricityMetersRef()` function to get a reference to the query.
const ref = listElectricityMetersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listElectricityMetersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.electricityMeters);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.electricityMeters);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateRoom
You can execute the `CreateRoom` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createRoom(vars: CreateRoomVariables): MutationPromise<CreateRoomData, CreateRoomVariables>;

interface CreateRoomRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateRoomVariables): MutationRef<CreateRoomData, CreateRoomVariables>;
}
export const createRoomRef: CreateRoomRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createRoom(dc: DataConnect, vars: CreateRoomVariables): MutationPromise<CreateRoomData, CreateRoomVariables>;

interface CreateRoomRef {
  ...
  (dc: DataConnect, vars: CreateRoomVariables): MutationRef<CreateRoomData, CreateRoomVariables>;
}
export const createRoomRef: CreateRoomRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createRoomRef:
```typescript
const name = createRoomRef.operationName;
console.log(name);
```

### Variables
The `CreateRoom` mutation requires an argument of type `CreateRoomVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateRoom` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateRoomData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateRoomData {
  roomUnit_insert: RoomUnit_Key;
}
```
### Using `CreateRoom`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createRoom, CreateRoomVariables } from '@dataconnect/generated';

// The `CreateRoom` mutation requires an argument of type `CreateRoomVariables`:
const createRoomVars: CreateRoomVariables = {
  roomNumber: ..., 
  floor: ..., 
  wing: ..., // optional
  roomType: ..., 
  capacity: ..., 
  monthlyPrice: ..., 
  deposit: ..., 
  status: ..., 
  notes: ..., // optional
};

// Call the `createRoom()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createRoom(createRoomVars);
// Variables can be defined inline as well.
const { data } = await createRoom({ roomNumber: ..., floor: ..., wing: ..., roomType: ..., capacity: ..., monthlyPrice: ..., deposit: ..., status: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createRoom(dataConnect, createRoomVars);

console.log(data.roomUnit_insert);

// Or, you can use the `Promise` API.
createRoom(createRoomVars).then((response) => {
  const data = response.data;
  console.log(data.roomUnit_insert);
});
```

### Using `CreateRoom`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createRoomRef, CreateRoomVariables } from '@dataconnect/generated';

// The `CreateRoom` mutation requires an argument of type `CreateRoomVariables`:
const createRoomVars: CreateRoomVariables = {
  roomNumber: ..., 
  floor: ..., 
  wing: ..., // optional
  roomType: ..., 
  capacity: ..., 
  monthlyPrice: ..., 
  deposit: ..., 
  status: ..., 
  notes: ..., // optional
};

// Call the `createRoomRef()` function to get a reference to the mutation.
const ref = createRoomRef(createRoomVars);
// Variables can be defined inline as well.
const ref = createRoomRef({ roomNumber: ..., floor: ..., wing: ..., roomType: ..., capacity: ..., monthlyPrice: ..., deposit: ..., status: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createRoomRef(dataConnect, createRoomVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.roomUnit_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.roomUnit_insert);
});
```

## CreateResident
You can execute the `CreateResident` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createResident(vars: CreateResidentVariables): MutationPromise<CreateResidentData, CreateResidentVariables>;

interface CreateResidentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateResidentVariables): MutationRef<CreateResidentData, CreateResidentVariables>;
}
export const createResidentRef: CreateResidentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createResident(dc: DataConnect, vars: CreateResidentVariables): MutationPromise<CreateResidentData, CreateResidentVariables>;

interface CreateResidentRef {
  ...
  (dc: DataConnect, vars: CreateResidentVariables): MutationRef<CreateResidentData, CreateResidentVariables>;
}
export const createResidentRef: CreateResidentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createResidentRef:
```typescript
const name = createResidentRef.operationName;
console.log(name);
```

### Variables
The `CreateResident` mutation requires an argument of type `CreateResidentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateResident` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateResidentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateResidentData {
  residentProfile_insert: ResidentProfile_Key;
}
```
### Using `CreateResident`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createResident, CreateResidentVariables } from '@dataconnect/generated';

// The `CreateResident` mutation requires an argument of type `CreateResidentVariables`:
const createResidentVars: CreateResidentVariables = {
  fullName: ..., 
  email: ..., 
  phone: ..., 
  roomNumber: ..., 
  moveInDate: ..., // optional
  leaseEndDate: ..., // optional
  monthlyRent: ..., // optional
  depositAmount: ..., // optional
  status: ..., 
  emergencyContact: ..., // optional
  emergencyPhone: ..., // optional
};

// Call the `createResident()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createResident(createResidentVars);
// Variables can be defined inline as well.
const { data } = await createResident({ fullName: ..., email: ..., phone: ..., roomNumber: ..., moveInDate: ..., leaseEndDate: ..., monthlyRent: ..., depositAmount: ..., status: ..., emergencyContact: ..., emergencyPhone: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createResident(dataConnect, createResidentVars);

console.log(data.residentProfile_insert);

// Or, you can use the `Promise` API.
createResident(createResidentVars).then((response) => {
  const data = response.data;
  console.log(data.residentProfile_insert);
});
```

### Using `CreateResident`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createResidentRef, CreateResidentVariables } from '@dataconnect/generated';

// The `CreateResident` mutation requires an argument of type `CreateResidentVariables`:
const createResidentVars: CreateResidentVariables = {
  fullName: ..., 
  email: ..., 
  phone: ..., 
  roomNumber: ..., 
  moveInDate: ..., // optional
  leaseEndDate: ..., // optional
  monthlyRent: ..., // optional
  depositAmount: ..., // optional
  status: ..., 
  emergencyContact: ..., // optional
  emergencyPhone: ..., // optional
};

// Call the `createResidentRef()` function to get a reference to the mutation.
const ref = createResidentRef(createResidentVars);
// Variables can be defined inline as well.
const ref = createResidentRef({ fullName: ..., email: ..., phone: ..., roomNumber: ..., moveInDate: ..., leaseEndDate: ..., monthlyRent: ..., depositAmount: ..., status: ..., emergencyContact: ..., emergencyPhone: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createResidentRef(dataConnect, createResidentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.residentProfile_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.residentProfile_insert);
});
```

## CreateMaintenanceTicket
You can execute the `CreateMaintenanceTicket` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createMaintenanceTicket(vars: CreateMaintenanceTicketVariables): MutationPromise<CreateMaintenanceTicketData, CreateMaintenanceTicketVariables>;

interface CreateMaintenanceTicketRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMaintenanceTicketVariables): MutationRef<CreateMaintenanceTicketData, CreateMaintenanceTicketVariables>;
}
export const createMaintenanceTicketRef: CreateMaintenanceTicketRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createMaintenanceTicket(dc: DataConnect, vars: CreateMaintenanceTicketVariables): MutationPromise<CreateMaintenanceTicketData, CreateMaintenanceTicketVariables>;

interface CreateMaintenanceTicketRef {
  ...
  (dc: DataConnect, vars: CreateMaintenanceTicketVariables): MutationRef<CreateMaintenanceTicketData, CreateMaintenanceTicketVariables>;
}
export const createMaintenanceTicketRef: CreateMaintenanceTicketRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createMaintenanceTicketRef:
```typescript
const name = createMaintenanceTicketRef.operationName;
console.log(name);
```

### Variables
The `CreateMaintenanceTicket` mutation requires an argument of type `CreateMaintenanceTicketVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateMaintenanceTicket` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateMaintenanceTicketData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateMaintenanceTicketData {
  maintenanceTicket_insert: MaintenanceTicket_Key;
}
```
### Using `CreateMaintenanceTicket`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createMaintenanceTicket, CreateMaintenanceTicketVariables } from '@dataconnect/generated';

// The `CreateMaintenanceTicket` mutation requires an argument of type `CreateMaintenanceTicketVariables`:
const createMaintenanceTicketVars: CreateMaintenanceTicketVariables = {
  roomNumber: ..., 
  residentId: ..., 
  residentName: ..., 
  title: ..., 
  category: ..., 
  description: ..., 
  priority: ..., 
  status: ..., 
  reportedDate: ..., // optional
};

// Call the `createMaintenanceTicket()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createMaintenanceTicket(createMaintenanceTicketVars);
// Variables can be defined inline as well.
const { data } = await createMaintenanceTicket({ roomNumber: ..., residentId: ..., residentName: ..., title: ..., category: ..., description: ..., priority: ..., status: ..., reportedDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createMaintenanceTicket(dataConnect, createMaintenanceTicketVars);

console.log(data.maintenanceTicket_insert);

// Or, you can use the `Promise` API.
createMaintenanceTicket(createMaintenanceTicketVars).then((response) => {
  const data = response.data;
  console.log(data.maintenanceTicket_insert);
});
```

### Using `CreateMaintenanceTicket`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createMaintenanceTicketRef, CreateMaintenanceTicketVariables } from '@dataconnect/generated';

// The `CreateMaintenanceTicket` mutation requires an argument of type `CreateMaintenanceTicketVariables`:
const createMaintenanceTicketVars: CreateMaintenanceTicketVariables = {
  roomNumber: ..., 
  residentId: ..., 
  residentName: ..., 
  title: ..., 
  category: ..., 
  description: ..., 
  priority: ..., 
  status: ..., 
  reportedDate: ..., // optional
};

// Call the `createMaintenanceTicketRef()` function to get a reference to the mutation.
const ref = createMaintenanceTicketRef(createMaintenanceTicketVars);
// Variables can be defined inline as well.
const ref = createMaintenanceTicketRef({ roomNumber: ..., residentId: ..., residentName: ..., title: ..., category: ..., description: ..., priority: ..., status: ..., reportedDate: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createMaintenanceTicketRef(dataConnect, createMaintenanceTicketVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.maintenanceTicket_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.maintenanceTicket_insert);
});
```

## SendChatMessage
You can execute the `SendChatMessage` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
sendChatMessage(vars: SendChatMessageVariables): MutationPromise<SendChatMessageData, SendChatMessageVariables>;

interface SendChatMessageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SendChatMessageVariables): MutationRef<SendChatMessageData, SendChatMessageVariables>;
}
export const sendChatMessageRef: SendChatMessageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
sendChatMessage(dc: DataConnect, vars: SendChatMessageVariables): MutationPromise<SendChatMessageData, SendChatMessageVariables>;

interface SendChatMessageRef {
  ...
  (dc: DataConnect, vars: SendChatMessageVariables): MutationRef<SendChatMessageData, SendChatMessageVariables>;
}
export const sendChatMessageRef: SendChatMessageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the sendChatMessageRef:
```typescript
const name = sendChatMessageRef.operationName;
console.log(name);
```

### Variables
The `SendChatMessage` mutation requires an argument of type `SendChatMessageVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SendChatMessageVariables {
  tenantId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
}
```
### Return Type
Recall that executing the `SendChatMessage` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SendChatMessageData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SendChatMessageData {
  chatMessage_insert: ChatMessage_Key;
}
```
### Using `SendChatMessage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, sendChatMessage, SendChatMessageVariables } from '@dataconnect/generated';

// The `SendChatMessage` mutation requires an argument of type `SendChatMessageVariables`:
const sendChatMessageVars: SendChatMessageVariables = {
  tenantId: ..., 
  senderId: ..., 
  senderName: ..., 
  senderRole: ..., 
  text: ..., 
};

// Call the `sendChatMessage()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await sendChatMessage(sendChatMessageVars);
// Variables can be defined inline as well.
const { data } = await sendChatMessage({ tenantId: ..., senderId: ..., senderName: ..., senderRole: ..., text: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await sendChatMessage(dataConnect, sendChatMessageVars);

console.log(data.chatMessage_insert);

// Or, you can use the `Promise` API.
sendChatMessage(sendChatMessageVars).then((response) => {
  const data = response.data;
  console.log(data.chatMessage_insert);
});
```

### Using `SendChatMessage`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, sendChatMessageRef, SendChatMessageVariables } from '@dataconnect/generated';

// The `SendChatMessage` mutation requires an argument of type `SendChatMessageVariables`:
const sendChatMessageVars: SendChatMessageVariables = {
  tenantId: ..., 
  senderId: ..., 
  senderName: ..., 
  senderRole: ..., 
  text: ..., 
};

// Call the `sendChatMessageRef()` function to get a reference to the mutation.
const ref = sendChatMessageRef(sendChatMessageVars);
// Variables can be defined inline as well.
const ref = sendChatMessageRef({ tenantId: ..., senderId: ..., senderName: ..., senderRole: ..., text: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = sendChatMessageRef(dataConnect, sendChatMessageVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.chatMessage_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.chatMessage_insert);
});
```

