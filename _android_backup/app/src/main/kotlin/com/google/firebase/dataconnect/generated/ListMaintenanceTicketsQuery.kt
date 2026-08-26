
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


import kotlinx.coroutines.flow.filterNotNull as _flow_filterNotNull
import kotlinx.coroutines.flow.map as _flow_map


public interface ListMaintenanceTicketsQuery :
    com.google.firebase.dataconnect.generated.GeneratedQuery<
      ExampleConnector,
      ListMaintenanceTicketsQuery.Data,
      Unit
    >
{
  

  
    @kotlinx.serialization.Serializable
  public data class Data(
  
    val maintenanceTickets: List<MaintenanceTicketsItem>,
  
  ) {
    
      
        @kotlinx.serialization.Serializable
  public data class MaintenanceTicketsItem(
  
    val id: String,
  
    val roomNumber: String,
  
    val residentId: String,
  
    val residentName: String,
  
    val title: String,
  
    val category: String,
  
    val description: String,
  
    val priority: String,
  
    val status: String,
  
    val reportedDate: String?,
  
    val assignedTechnician: String?,
  
    val notes: String?,
  
  ) {
    
    
  }
      
    
    
  }
  

  public companion object {
    public val operationName: String = "ListMaintenanceTickets"

    public val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data> =
      kotlinx.serialization.serializer()

    public val variablesSerializer: kotlinx.serialization.SerializationStrategy<Unit> =
      kotlinx.serialization.serializer()
  }
}

public fun ListMaintenanceTicketsQuery.ref(
  
): com.google.firebase.dataconnect.QueryRef<
    ListMaintenanceTicketsQuery.Data,
    Unit
  > =
  ref(
    
      Unit
    
  )

public suspend fun ListMaintenanceTicketsQuery.execute(

  
    fetchPolicy: com.google.firebase.dataconnect.QueryRef.FetchPolicy = com.google.firebase.dataconnect.QueryRef.FetchPolicy.PREFER_CACHE,
  

  ): com.google.firebase.dataconnect.QueryResult<
    ListMaintenanceTicketsQuery.Data,
    Unit
  > =
  ref(
    
  ).execute(fetchPolicy = fetchPolicy)


  public fun ListMaintenanceTicketsQuery.flow(
    
    ): kotlinx.coroutines.flow.Flow<ListMaintenanceTicketsQuery.Data> =
    ref(
        
      ).subscribe()
      .flow
      ._flow_map { querySubscriptionResult -> querySubscriptionResult.result.getOrNull() }
      ._flow_filterNotNull()
      ._flow_map { it.data }

