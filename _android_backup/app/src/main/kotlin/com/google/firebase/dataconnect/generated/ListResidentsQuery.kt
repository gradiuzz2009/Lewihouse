
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


public interface ListResidentsQuery :
    com.google.firebase.dataconnect.generated.GeneratedQuery<
      ExampleConnector,
      ListResidentsQuery.Data,
      Unit
    >
{
  

  
    @kotlinx.serialization.Serializable
  public data class Data(
  
    val residentProfiles: List<ResidentProfilesItem>,
  
  ) {
    
      
        @kotlinx.serialization.Serializable
  public data class ResidentProfilesItem(
  
    val id: String,
  
    val fullName: String,
  
    val email: String,
  
    val phone: String,
  
    val roomNumber: String,
  
    val moveInDate: String?,
  
    val leaseEndDate: String?,
  
    val monthlyRent: Double?,
  
    val depositAmount: Double?,
  
    val status: String,
  
    val emergencyContact: String?,
  
    val emergencyPhone: String?,
  
  ) {
    
    
  }
      
    
    
  }
  

  public companion object {
    public val operationName: String = "ListResidents"

    public val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data> =
      kotlinx.serialization.serializer()

    public val variablesSerializer: kotlinx.serialization.SerializationStrategy<Unit> =
      kotlinx.serialization.serializer()
  }
}

public fun ListResidentsQuery.ref(
  
): com.google.firebase.dataconnect.QueryRef<
    ListResidentsQuery.Data,
    Unit
  > =
  ref(
    
      Unit
    
  )

public suspend fun ListResidentsQuery.execute(

  
    fetchPolicy: com.google.firebase.dataconnect.QueryRef.FetchPolicy = com.google.firebase.dataconnect.QueryRef.FetchPolicy.PREFER_CACHE,
  

  ): com.google.firebase.dataconnect.QueryResult<
    ListResidentsQuery.Data,
    Unit
  > =
  ref(
    
  ).execute(fetchPolicy = fetchPolicy)


  public fun ListResidentsQuery.flow(
    
    ): kotlinx.coroutines.flow.Flow<ListResidentsQuery.Data> =
    ref(
        
      ).subscribe()
      .flow
      ._flow_map { querySubscriptionResult -> querySubscriptionResult.result.getOrNull() }
      ._flow_filterNotNull()
      ._flow_map { it.data }

