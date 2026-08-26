
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



public interface SendChatMessageMutation :
    com.google.firebase.dataconnect.generated.GeneratedMutation<
      ExampleConnector,
      SendChatMessageMutation.Data,
      SendChatMessageMutation.Variables
    >
{
  
    @kotlinx.serialization.Serializable
  public data class Variables(
  
    val tenantId: String,
  
    val senderId: String,
  
    val senderName: String,
  
    val senderRole: String,
  
    val text: String,
  
  ) {
    
    
  }
  

  
    @kotlinx.serialization.Serializable
  public data class Data(
  
    val chatMessage_insert: ChatMessageKey,
  
  ) {
    
    
  }
  

  public companion object {
    public val operationName: String = "SendChatMessage"

    public val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data> =
      kotlinx.serialization.serializer()

    public val variablesSerializer: kotlinx.serialization.SerializationStrategy<Variables> =
      kotlinx.serialization.serializer()
  }
}

public fun SendChatMessageMutation.ref(
  
    tenantId: String,senderId: String,senderName: String,senderRole: String,text: String,

  
  
): com.google.firebase.dataconnect.MutationRef<
    SendChatMessageMutation.Data,
    SendChatMessageMutation.Variables
  > =
  ref(
    
      SendChatMessageMutation.Variables(
        tenantId=tenantId,senderId=senderId,senderName=senderName,senderRole=senderRole,text=text,
  
      )
    
  )

public suspend fun SendChatMessageMutation.execute(

  
    
      tenantId: String,senderId: String,senderName: String,senderRole: String,text: String,

  

  ): com.google.firebase.dataconnect.MutationResult<
    SendChatMessageMutation.Data,
    SendChatMessageMutation.Variables
  > =
  ref(
    
      tenantId=tenantId,senderId=senderId,senderName=senderName,senderRole=senderRole,text=text,
  
    
  ).execute()


