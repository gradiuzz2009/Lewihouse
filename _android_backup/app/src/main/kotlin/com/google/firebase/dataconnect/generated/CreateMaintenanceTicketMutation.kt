
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



public interface CreateMaintenanceTicketMutation :
    com.google.firebase.dataconnect.generated.GeneratedMutation<
      ExampleConnector,
      CreateMaintenanceTicketMutation.Data,
      CreateMaintenanceTicketMutation.Variables
    >
{
  
    @kotlinx.serialization.Serializable
  public data class Variables(
  
    val roomNumber: String,
  
    val residentId: String,
  
    val residentName: String,
  
    val title: String,
  
    val category: String,
  
    val description: String,
  
    val priority: String,
  
    val status: String,
  
    val reportedDate: com.google.firebase.dataconnect.OptionalVariable<String?>,
  
  ) {
    
    
      
      @kotlin.DslMarker public annotation class BuilderDsl

      
      @BuilderDsl
      public interface Builder {
        public var roomNumber: String
        public var residentId: String
        public var residentName: String
        public var title: String
        public var category: String
        public var description: String
        public var priority: String
        public var status: String
        public var reportedDate: String?
        
      }

      public companion object {
        
        @Suppress("NAME_SHADOWING")
        public fun build(
          roomNumber: String,residentId: String,residentName: String,title: String,category: String,description: String,priority: String,status: String,
          block_: Builder.() -> Unit
        ): Variables {
          var roomNumber= roomNumber
            var residentId= residentId
            var residentName= residentName
            var title= title
            var category= category
            var description= description
            var priority= priority
            var status= status
            var reportedDate: com.google.firebase.dataconnect.OptionalVariable<String?> =
                com.google.firebase.dataconnect.OptionalVariable.Undefined
            

          return object : Builder {
            override var roomNumber: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { roomNumber = value_ }
              
            override var residentId: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { residentId = value_ }
              
            override var residentName: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { residentName = value_ }
              
            override var title: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { title = value_ }
              
            override var category: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { category = value_ }
              
            override var description: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { description = value_ }
              
            override var priority: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { priority = value_ }
              
            override var status: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { status = value_ }
              
            override var reportedDate: String?
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { reportedDate = com.google.firebase.dataconnect.OptionalVariable.Value(value_) }
              
            
          }.apply(block_)
          .let {
            Variables(
              roomNumber=roomNumber,residentId=residentId,residentName=residentName,title=title,category=category,description=description,priority=priority,status=status,reportedDate=reportedDate,
            )
          }
        }
      }
    
  }
  

  
    @kotlinx.serialization.Serializable
  public data class Data(
  
    val maintenanceTicket_insert: MaintenanceTicketKey,
  
  ) {
    
    
  }
  

  public companion object {
    public val operationName: String = "CreateMaintenanceTicket"

    public val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data> =
      kotlinx.serialization.serializer()

    public val variablesSerializer: kotlinx.serialization.SerializationStrategy<Variables> =
      kotlinx.serialization.serializer()
  }
}

public fun CreateMaintenanceTicketMutation.ref(
  
    roomNumber: String,residentId: String,residentName: String,title: String,category: String,description: String,priority: String,status: String,

  
    block_: CreateMaintenanceTicketMutation.Variables.Builder.() -> Unit = {}
  
): com.google.firebase.dataconnect.MutationRef<
    CreateMaintenanceTicketMutation.Data,
    CreateMaintenanceTicketMutation.Variables
  > =
  ref(
    
      CreateMaintenanceTicketMutation.Variables.build(
        roomNumber=roomNumber,residentId=residentId,residentName=residentName,title=title,category=category,description=description,priority=priority,status=status,
  
    block_
      )
    
  )

public suspend fun CreateMaintenanceTicketMutation.execute(

  
    
      roomNumber: String,residentId: String,residentName: String,title: String,category: String,description: String,priority: String,status: String,

  
    block_: CreateMaintenanceTicketMutation.Variables.Builder.() -> Unit = {}

  ): com.google.firebase.dataconnect.MutationResult<
    CreateMaintenanceTicketMutation.Data,
    CreateMaintenanceTicketMutation.Variables
  > =
  ref(
    
      roomNumber=roomNumber,residentId=residentId,residentName=residentName,title=title,category=category,description=description,priority=priority,status=status,
  
    block_
    
  ).execute()


