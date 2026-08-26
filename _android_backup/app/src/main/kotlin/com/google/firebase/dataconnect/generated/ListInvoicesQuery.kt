
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


public interface ListInvoicesQuery :
    com.google.firebase.dataconnect.generated.GeneratedQuery<
      ExampleConnector,
      ListInvoicesQuery.Data,
      Unit
    >
{
  

  
    @kotlinx.serialization.Serializable
  public data class Data(
  
    val billingInvoices: List<BillingInvoicesItem>,
  
  ) {
    
      
        @kotlinx.serialization.Serializable
  public data class BillingInvoicesItem(
  
    val id: String,
  
    val residentId: String,
  
    val roomNumber: String,
  
    val invoiceNumber: String,
  
    val amount: Double,
  
    val paidAmount: Double?,
  
    val period: String?,
  
    val status: String,
  
    val dueDate: String?,
  
    val paymentMethod: String?,
  
    val receiptRef: String?,
  
    val notes: String?,
  
  ) {
    
    
  }
      
    
    
  }
  

  public companion object {
    public val operationName: String = "ListInvoices"

    public val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data> =
      kotlinx.serialization.serializer()

    public val variablesSerializer: kotlinx.serialization.SerializationStrategy<Unit> =
      kotlinx.serialization.serializer()
  }
}

public fun ListInvoicesQuery.ref(
  
): com.google.firebase.dataconnect.QueryRef<
    ListInvoicesQuery.Data,
    Unit
  > =
  ref(
    
      Unit
    
  )

public suspend fun ListInvoicesQuery.execute(

  
    fetchPolicy: com.google.firebase.dataconnect.QueryRef.FetchPolicy = com.google.firebase.dataconnect.QueryRef.FetchPolicy.PREFER_CACHE,
  

  ): com.google.firebase.dataconnect.QueryResult<
    ListInvoicesQuery.Data,
    Unit
  > =
  ref(
    
  ).execute(fetchPolicy = fetchPolicy)


  public fun ListInvoicesQuery.flow(
    
    ): kotlinx.coroutines.flow.Flow<ListInvoicesQuery.Data> =
    ref(
        
      ).subscribe()
      .flow
      ._flow_map { querySubscriptionResult -> querySubscriptionResult.result.getOrNull() }
      ._flow_filterNotNull()
      ._flow_map { it.data }

