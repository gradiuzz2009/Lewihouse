# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateRoom, useCreateResident, useCreateMaintenanceTicket, useSendChatMessage, useListRooms, useListResidents, useListInvoices, useListMaintenanceTickets, useListElectricityMeters } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateRoom(createRoomVars);

const { data, isPending, isSuccess, isError, error } = useCreateResident(createResidentVars);

const { data, isPending, isSuccess, isError, error } = useCreateMaintenanceTicket(createMaintenanceTicketVars);

const { data, isPending, isSuccess, isError, error } = useSendChatMessage(sendChatMessageVars);

const { data, isPending, isSuccess, isError, error } = useListRooms();

const { data, isPending, isSuccess, isError, error } = useListResidents();

const { data, isPending, isSuccess, isError, error } = useListInvoices();

const { data, isPending, isSuccess, isError, error } = useListMaintenanceTickets();

const { data, isPending, isSuccess, isError, error } = useListElectricityMeters();

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createRoom, createResident, createMaintenanceTicket, sendChatMessage, listRooms, listResidents, listInvoices, listMaintenanceTickets, listElectricityMeters } from '@dataconnect/generated';


// Operation CreateRoom:  For variables, look at type CreateRoomVars in ../index.d.ts
const { data } = await CreateRoom(dataConnect, createRoomVars);

// Operation CreateResident:  For variables, look at type CreateResidentVars in ../index.d.ts
const { data } = await CreateResident(dataConnect, createResidentVars);

// Operation CreateMaintenanceTicket:  For variables, look at type CreateMaintenanceTicketVars in ../index.d.ts
const { data } = await CreateMaintenanceTicket(dataConnect, createMaintenanceTicketVars);

// Operation SendChatMessage:  For variables, look at type SendChatMessageVars in ../index.d.ts
const { data } = await SendChatMessage(dataConnect, sendChatMessageVars);

// Operation ListRooms: 
const { data } = await ListRooms(dataConnect);

// Operation ListResidents: 
const { data } = await ListResidents(dataConnect);

// Operation ListInvoices: 
const { data } = await ListInvoices(dataConnect);

// Operation ListMaintenanceTickets: 
const { data } = await ListMaintenanceTickets(dataConnect);

// Operation ListElectricityMeters: 
const { data } = await ListElectricityMeters(dataConnect);


```