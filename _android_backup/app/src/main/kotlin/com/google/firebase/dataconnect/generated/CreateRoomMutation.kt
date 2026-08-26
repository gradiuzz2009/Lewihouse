
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



public interface CreateRoomMutation :
    com.google.firebase.dataconnect.generated.GeneratedMutation<
      ExampleConnector,
      CreateRoomMutation.Data,
      CreateRoomMutation.Variables
    >
{
  
    @kotlinx.serialization.Serializable
  public data class Variables(
  
    val roomNumber: String,
  
    val floor: String,
  
    val wing: com.google.firebase.dataconnect.OptionalVariable<String?>,
  
    val roomType: String,
  
    val capacity: Int,
  
    val monthlyPrice: Double,
  
    val deposit: Double,
  
    val status: String,
  
    val notes: com.google.firebase.dataconnect.OptionalVariable<String?>,
  
  ) {
    
    
      
      @kotlin.DslMarker public annotation class BuilderDsl

      
      @BuilderDsl
      public interface Builder {
        public var roomNumber: String
        public var floor: String
        public var wing: String?
        public var roomType: String
        public var capacity: Int
        public var monthlyPrice: Double
        public var deposit: Double
        public var status: String
        public var notes: String?
        
      }

      public companion object {
        
        @Suppress("NAME_SHADOWING")
        public fun build(
          roomNumber: String,floor: String,roomType: String,capacity: Int,monthlyPrice: Double,deposit: Double,status: String,
          block_: Builder.() -> Unit
        ): Variables {
          var roomNumber= roomNumber
            var floor= floor
            var wing: com.google.firebase.dataconnect.OptionalVariable<String?> =
                com.google.firebase.dataconnect.OptionalVariable.Undefined
            var roomType= roomType
            var capacity= capacity
            var monthlyPrice= monthlyPrice
            var deposit= deposit
            var status= status
            var notes: com.google.firebase.dataconnect.OptionalVariable<String?> =
                com.google.firebase.dataconnect.OptionalVariable.Undefined
            

          return object : Builder {
            override var roomNumber: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { roomNumber = value_ }
              
            override var floor: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { floor = value_ }
              
            override var wing: String?
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { wing = com.google.firebase.dataconnect.OptionalVariable.Value(value_) }
              
            override var roomType: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { roomType = value_ }
              
            override var capacity: Int
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { capacity = value_ }
              
            override var monthlyPrice: Double
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { monthlyPrice = value_ }
              
            override var deposit: Double
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { deposit = value_ }
              
            override var status: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { status = value_ }
              
            override var notes: String?
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { notes = com.google.firebase.dataconnect.OptionalVariable.Value(value_) }
              
            
          }.apply(block_)
          .let {
            Variables(
              roomNumber=roomNumber,floor=floor,wing=wing,roomType=roomType,capacity=capacity,monthlyPrice=monthlyPrice,deposit=deposit,status=status,notes=notes,
            )
          }
        }
      }
    
  }
  

  
    @kotlinx.serialization.Serializable
  public data class Data(
  
    val roomUnit_insert: RoomUnitKey,
  
  ) {
    
    
  }
  

  public companion object {
    public val operationName: String = "CreateRoom"

    public val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data> =
      kotlinx.serialization.serializer()

    public val variablesSerializer: kotlinx.serialization.SerializationStrategy<Variables> =
      kotlinx.serialization.serializer()
  }
}

public fun CreateRoomMutation.ref(
  
    roomNumber: String,floor: String,roomType: String,capacity: Int,monthlyPrice: Double,deposit: Double,status: String,

  
    block_: CreateRoomMutation.Variables.Builder.() -> Unit = {}
  
): com.google.firebase.dataconnect.MutationRef<
    CreateRoomMutation.Data,
    CreateRoomMutation.Variables
  > =
  ref(
    
      CreateRoomMutation.Variables.build(
        roomNumber=roomNumber,floor=floor,roomType=roomType,capacity=capacity,monthlyPrice=monthlyPrice,deposit=deposit,status=status,
  
    block_
      )
    
  )

public suspend fun CreateRoomMutation.execute(

  
    
      roomNumber: String,floor: String,roomType: String,capacity: Int,monthlyPrice: Double,deposit: Double,status: String,

  
    block_: CreateRoomMutation.Variables.Builder.() -> Unit = {}

  ): com.google.firebase.dataconnect.MutationResult<
    CreateRoomMutation.Data,
    CreateRoomMutation.Variables
  > =
  ref(
    
      roomNumber=roomNumber,floor=floor,roomType=roomType,capacity=capacity,monthlyPrice=monthlyPrice,deposit=deposit,status=status,
  
    block_
    
  ).execute()


