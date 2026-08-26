
@file:Suppress(
  "KotlinRedundantDiagnosticSuppress",
  "PropertyName",
  "MayBeConstant",
  "RedundantVisibilityModifier",
  "RedundantCompanionReference",
  "RemoveEmptyClassBody",
  "SpellCheckingInspection",
  "unused",
)

package com.google.firebase.dataconnect.generated

import com.google.firebase.dataconnect.getInstance as _fdcGetInstance
import kotlin.time.Duration.Companion.milliseconds as _milliseconds

public interface ExampleConnector : com.google.firebase.dataconnect.generated.GeneratedConnector<ExampleConnector> {
  override val dataConnect: com.google.firebase.dataconnect.FirebaseDataConnect

  
    public val createMaintenanceTicket: CreateMaintenanceTicketMutation
  
    public val createResident: CreateResidentMutation
  
    public val createRoom: CreateRoomMutation
  
    public val listElectricityMeters: ListElectricityMetersQuery
  
    public val listInvoices: ListInvoicesQuery
  
    public val listMaintenanceTickets: ListMaintenanceTicketsQuery
  
    public val listResidents: ListResidentsQuery
  
    public val listRooms: ListRoomsQuery
  
    public val sendChatMessage: SendChatMessageMutation
  

  public companion object {
    @Suppress("MemberVisibilityCanBePrivate")
    public val config: com.google.firebase.dataconnect.ConnectorConfig = com.google.firebase.dataconnect.ConnectorConfig(
      connector = "example",
      location = "asia-southeast1",
      serviceId = "lewihouse",
    )

    public fun getInstance(
      dataConnect: com.google.firebase.dataconnect.FirebaseDataConnect
    ):ExampleConnector = synchronized(instances) {
      instances.getOrPut(dataConnect) {
        ExampleConnectorImpl(dataConnect)
      }
    }

    private val instances = java.util.WeakHashMap<com.google.firebase.dataconnect.FirebaseDataConnect, ExampleConnectorImpl>()

    
    public val defaultCacheSettings: com.google.firebase.dataconnect.CacheSettings =
      com.google.firebase.dataconnect.CacheSettings(
        
        
      )

    public val defaultDataConnectSettings: com.google.firebase.dataconnect.DataConnectSettings =
      com.google.firebase.dataconnect.DataConnectSettings(
        cacheSettings = defaultCacheSettings,
      )
    
  }
}

public val ExampleConnector.Companion.instance:ExampleConnector
  get() = getInstance(com.google.firebase.dataconnect.FirebaseDataConnect._fdcGetInstance(
    config, defaultDataConnectSettings
  ))

public fun ExampleConnector.Companion.getInstance(
  settings: com.google.firebase.dataconnect.DataConnectSettings = defaultDataConnectSettings
):ExampleConnector =
  getInstance(com.google.firebase.dataconnect.FirebaseDataConnect._fdcGetInstance(config, settings))

public fun ExampleConnector.Companion.getInstance(
  app: com.google.firebase.FirebaseApp,
  settings: com.google.firebase.dataconnect.DataConnectSettings = defaultDataConnectSettings
):ExampleConnector =
  getInstance(com.google.firebase.dataconnect.FirebaseDataConnect._fdcGetInstance(app, config, settings))

private class ExampleConnectorImpl(
  override val dataConnect: com.google.firebase.dataconnect.FirebaseDataConnect
) : ExampleConnector {
  
    override val createMaintenanceTicket by lazy(LazyThreadSafetyMode.PUBLICATION) {
      CreateMaintenanceTicketMutationImpl(this)
    }
  
    override val createResident by lazy(LazyThreadSafetyMode.PUBLICATION) {
      CreateResidentMutationImpl(this)
    }
  
    override val createRoom by lazy(LazyThreadSafetyMode.PUBLICATION) {
      CreateRoomMutationImpl(this)
    }
  
    override val listElectricityMeters by lazy(LazyThreadSafetyMode.PUBLICATION) {
      ListElectricityMetersQueryImpl(this)
    }
  
    override val listInvoices by lazy(LazyThreadSafetyMode.PUBLICATION) {
      ListInvoicesQueryImpl(this)
    }
  
    override val listMaintenanceTickets by lazy(LazyThreadSafetyMode.PUBLICATION) {
      ListMaintenanceTicketsQueryImpl(this)
    }
  
    override val listResidents by lazy(LazyThreadSafetyMode.PUBLICATION) {
      ListResidentsQueryImpl(this)
    }
  
    override val listRooms by lazy(LazyThreadSafetyMode.PUBLICATION) {
      ListRoomsQueryImpl(this)
    }
  
    override val sendChatMessage by lazy(LazyThreadSafetyMode.PUBLICATION) {
      SendChatMessageMutationImpl(this)
    }
  

  @com.google.firebase.dataconnect.ExperimentalFirebaseDataConnect
  override fun operations(): List<com.google.firebase.dataconnect.generated.GeneratedOperation<ExampleConnector, *, *>> =
    queries() + mutations()

  @com.google.firebase.dataconnect.ExperimentalFirebaseDataConnect
  override fun mutations(): List<com.google.firebase.dataconnect.generated.GeneratedMutation<ExampleConnector, *, *>> =
    listOf(
      createMaintenanceTicket,
        createResident,
        createRoom,
        sendChatMessage,
        
    )

  @com.google.firebase.dataconnect.ExperimentalFirebaseDataConnect
  override fun queries(): List<com.google.firebase.dataconnect.generated.GeneratedQuery<ExampleConnector, *, *>> =
    listOf(
      listElectricityMeters,
        listInvoices,
        listMaintenanceTickets,
        listResidents,
        listRooms,
        
    )

  @com.google.firebase.dataconnect.ExperimentalFirebaseDataConnect
  override fun copy(dataConnect: com.google.firebase.dataconnect.FirebaseDataConnect) =
    ExampleConnectorImpl(dataConnect)

  override fun equals(other: Any?): Boolean =
    other is ExampleConnectorImpl &&
    other.dataConnect == dataConnect

  override fun hashCode(): Int =
    java.util.Objects.hash(
      "ExampleConnectorImpl",
      dataConnect,
    )

  override fun toString(): String =
    "ExampleConnectorImpl(dataConnect=$dataConnect)"
}



private open class ExampleConnectorGeneratedQueryImpl<Data, Variables>(
  override val connector: ExampleConnector,
  override val operationName: String,
  override val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data>,
  override val variablesSerializer: kotlinx.serialization.SerializationStrategy<Variables>,
) : com.google.firebase.dataconnect.generated.GeneratedQuery<ExampleConnector, Data, Variables> {

  @com.google.firebase.dataconnect.ExperimentalFirebaseDataConnect
  override fun copy(
    connector: ExampleConnector,
    operationName: String,
    dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data>,
    variablesSerializer: kotlinx.serialization.SerializationStrategy<Variables>,
  ) =
    ExampleConnectorGeneratedQueryImpl(
      connector, operationName, dataDeserializer, variablesSerializer
    )

  @com.google.firebase.dataconnect.ExperimentalFirebaseDataConnect
  override fun <NewVariables> withVariablesSerializer(
    variablesSerializer: kotlinx.serialization.SerializationStrategy<NewVariables>
  ) =
    ExampleConnectorGeneratedQueryImpl(
      connector, operationName, dataDeserializer, variablesSerializer
    )

  @com.google.firebase.dataconnect.ExperimentalFirebaseDataConnect
  override fun <NewData> withDataDeserializer(
    dataDeserializer: kotlinx.serialization.DeserializationStrategy<NewData>
  ) =
    ExampleConnectorGeneratedQueryImpl(
      connector, operationName, dataDeserializer, variablesSerializer
    )

  override fun equals(other: Any?): Boolean =
    other is ExampleConnectorGeneratedQueryImpl<*,*> &&
    other.connector == connector &&
    other.operationName == operationName &&
    other.dataDeserializer == dataDeserializer &&
    other.variablesSerializer == variablesSerializer

  override fun hashCode(): Int =
    java.util.Objects.hash(
      "ExampleConnectorGeneratedQueryImpl",
      connector, operationName, dataDeserializer, variablesSerializer
    )

  override fun toString(): String =
    "ExampleConnectorGeneratedQueryImpl(" +
    "operationName=$operationName, " +
    "dataDeserializer=$dataDeserializer, " +
    "variablesSerializer=$variablesSerializer, " +
    "connector=$connector)"
}

private open class ExampleConnectorGeneratedMutationImpl<Data, Variables>(
  override val connector: ExampleConnector,
  override val operationName: String,
  override val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data>,
  override val variablesSerializer: kotlinx.serialization.SerializationStrategy<Variables>,
) : com.google.firebase.dataconnect.generated.GeneratedMutation<ExampleConnector, Data, Variables> {

  @com.google.firebase.dataconnect.ExperimentalFirebaseDataConnect
  override fun copy(
    connector: ExampleConnector,
    operationName: String,
    dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data>,
    variablesSerializer: kotlinx.serialization.SerializationStrategy<Variables>,
  ) =
    ExampleConnectorGeneratedMutationImpl(
      connector, operationName, dataDeserializer, variablesSerializer
    )

  @com.google.firebase.dataconnect.ExperimentalFirebaseDataConnect
  override fun <NewVariables> withVariablesSerializer(
    variablesSerializer: kotlinx.serialization.SerializationStrategy<NewVariables>
  ) =
    ExampleConnectorGeneratedMutationImpl(
      connector, operationName, dataDeserializer, variablesSerializer
    )

  @com.google.firebase.dataconnect.ExperimentalFirebaseDataConnect
  override fun <NewData> withDataDeserializer(
    dataDeserializer: kotlinx.serialization.DeserializationStrategy<NewData>
  ) =
    ExampleConnectorGeneratedMutationImpl(
      connector, operationName, dataDeserializer, variablesSerializer
    )

  override fun equals(other: Any?): Boolean =
    other is ExampleConnectorGeneratedMutationImpl<*,*> &&
    other.connector == connector &&
    other.operationName == operationName &&
    other.dataDeserializer == dataDeserializer &&
    other.variablesSerializer == variablesSerializer

  override fun hashCode(): Int =
    java.util.Objects.hash(
      "ExampleConnectorGeneratedMutationImpl",
      connector, operationName, dataDeserializer, variablesSerializer
    )

  override fun toString(): String =
    "ExampleConnectorGeneratedMutationImpl(" +
    "operationName=$operationName, " +
    "dataDeserializer=$dataDeserializer, " +
    "variablesSerializer=$variablesSerializer, " +
    "connector=$connector)"
}



private class CreateMaintenanceTicketMutationImpl(
  connector: ExampleConnector
):
  CreateMaintenanceTicketMutation,
  ExampleConnectorGeneratedMutationImpl<
      CreateMaintenanceTicketMutation.Data,
      CreateMaintenanceTicketMutation.Variables
  >(
    connector,
    CreateMaintenanceTicketMutation.Companion.operationName,
    CreateMaintenanceTicketMutation.Companion.dataDeserializer,
    CreateMaintenanceTicketMutation.Companion.variablesSerializer,
  )


private class CreateResidentMutationImpl(
  connector: ExampleConnector
):
  CreateResidentMutation,
  ExampleConnectorGeneratedMutationImpl<
      CreateResidentMutation.Data,
      CreateResidentMutation.Variables
  >(
    connector,
    CreateResidentMutation.Companion.operationName,
    CreateResidentMutation.Companion.dataDeserializer,
    CreateResidentMutation.Companion.variablesSerializer,
  )


private class CreateRoomMutationImpl(
  connector: ExampleConnector
):
  CreateRoomMutation,
  ExampleConnectorGeneratedMutationImpl<
      CreateRoomMutation.Data,
      CreateRoomMutation.Variables
  >(
    connector,
    CreateRoomMutation.Companion.operationName,
    CreateRoomMutation.Companion.dataDeserializer,
    CreateRoomMutation.Companion.variablesSerializer,
  )


private class ListElectricityMetersQueryImpl(
  connector: ExampleConnector
):
  ListElectricityMetersQuery,
  ExampleConnectorGeneratedQueryImpl<
      ListElectricityMetersQuery.Data,
      Unit
  >(
    connector,
    ListElectricityMetersQuery.Companion.operationName,
    ListElectricityMetersQuery.Companion.dataDeserializer,
    ListElectricityMetersQuery.Companion.variablesSerializer,
  )


private class ListInvoicesQueryImpl(
  connector: ExampleConnector
):
  ListInvoicesQuery,
  ExampleConnectorGeneratedQueryImpl<
      ListInvoicesQuery.Data,
      Unit
  >(
    connector,
    ListInvoicesQuery.Companion.operationName,
    ListInvoicesQuery.Companion.dataDeserializer,
    ListInvoicesQuery.Companion.variablesSerializer,
  )


private class ListMaintenanceTicketsQueryImpl(
  connector: ExampleConnector
):
  ListMaintenanceTicketsQuery,
  ExampleConnectorGeneratedQueryImpl<
      ListMaintenanceTicketsQuery.Data,
      Unit
  >(
    connector,
    ListMaintenanceTicketsQuery.Companion.operationName,
    ListMaintenanceTicketsQuery.Companion.dataDeserializer,
    ListMaintenanceTicketsQuery.Companion.variablesSerializer,
  )


private class ListResidentsQueryImpl(
  connector: ExampleConnector
):
  ListResidentsQuery,
  ExampleConnectorGeneratedQueryImpl<
      ListResidentsQuery.Data,
      Unit
  >(
    connector,
    ListResidentsQuery.Companion.operationName,
    ListResidentsQuery.Companion.dataDeserializer,
    ListResidentsQuery.Companion.variablesSerializer,
  )


private class ListRoomsQueryImpl(
  connector: ExampleConnector
):
  ListRoomsQuery,
  ExampleConnectorGeneratedQueryImpl<
      ListRoomsQuery.Data,
      Unit
  >(
    connector,
    ListRoomsQuery.Companion.operationName,
    ListRoomsQuery.Companion.dataDeserializer,
    ListRoomsQuery.Companion.variablesSerializer,
  )


private class SendChatMessageMutationImpl(
  connector: ExampleConnector
):
  SendChatMessageMutation,
  ExampleConnectorGeneratedMutationImpl<
      SendChatMessageMutation.Data,
      SendChatMessageMutation.Variables
  >(
    connector,
    SendChatMessageMutation.Companion.operationName,
    SendChatMessageMutation.Companion.dataDeserializer,
    SendChatMessageMutation.Companion.variablesSerializer,
  )


