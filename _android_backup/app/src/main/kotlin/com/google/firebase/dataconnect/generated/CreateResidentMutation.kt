
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



public interface CreateResidentMutation :
    com.google.firebase.dataconnect.generated.GeneratedMutation<
      ExampleConnector,
      CreateResidentMutation.Data,
      CreateResidentMutation.Variables
    >
{
  
    @kotlinx.serialization.Serializable
  public data class Variables(
  
    val fullName: String,
  
    val email: String,
  
    val phone: String,
  
    val roomNumber: String,
  
    val moveInDate: com.google.firebase.dataconnect.OptionalVariable<String?>,
  
    val leaseEndDate: com.google.firebase.dataconnect.OptionalVariable<String?>,
  
    val monthlyRent: com.google.firebase.dataconnect.OptionalVariable<Double?>,
  
    val depositAmount: com.google.firebase.dataconnect.OptionalVariable<Double?>,
  
    val status: String,
  
    val emergencyContact: com.google.firebase.dataconnect.OptionalVariable<String?>,
  
    val emergencyPhone: com.google.firebase.dataconnect.OptionalVariable<String?>,
  
  ) {
    
    
      
      @kotlin.DslMarker public annotation class BuilderDsl

      
      @BuilderDsl
      public interface Builder {
        public var fullName: String
        public var email: String
        public var phone: String
        public var roomNumber: String
        public var moveInDate: String?
        public var leaseEndDate: String?
        public var monthlyRent: Double?
        public var depositAmount: Double?
        public var status: String
        public var emergencyContact: String?
        public var emergencyPhone: String?
        
      }

      public companion object {
        
        @Suppress("NAME_SHADOWING")
        public fun build(
          fullName: String,email: String,phone: String,roomNumber: String,status: String,
          block_: Builder.() -> Unit
        ): Variables {
          var fullName= fullName
            var email= email
            var phone= phone
            var roomNumber= roomNumber
            var moveInDate: com.google.firebase.dataconnect.OptionalVariable<String?> =
                com.google.firebase.dataconnect.OptionalVariable.Undefined
            var leaseEndDate: com.google.firebase.dataconnect.OptionalVariable<String?> =
                com.google.firebase.dataconnect.OptionalVariable.Undefined
            var monthlyRent: com.google.firebase.dataconnect.OptionalVariable<Double?> =
                com.google.firebase.dataconnect.OptionalVariable.Undefined
            var depositAmount: com.google.firebase.dataconnect.OptionalVariable<Double?> =
                com.google.firebase.dataconnect.OptionalVariable.Undefined
            var status= status
            var emergencyContact: com.google.firebase.dataconnect.OptionalVariable<String?> =
                com.google.firebase.dataconnect.OptionalVariable.Undefined
            var emergencyPhone: com.google.firebase.dataconnect.OptionalVariable<String?> =
                com.google.firebase.dataconnect.OptionalVariable.Undefined
            

          return object : Builder {
            override var fullName: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { fullName = value_ }
              
            override var email: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { email = value_ }
              
            override var phone: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { phone = value_ }
              
            override var roomNumber: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { roomNumber = value_ }
              
            override var moveInDate: String?
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { moveInDate = com.google.firebase.dataconnect.OptionalVariable.Value(value_) }
              
            override var leaseEndDate: String?
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { leaseEndDate = com.google.firebase.dataconnect.OptionalVariable.Value(value_) }
              
            override var monthlyRent: Double?
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { monthlyRent = com.google.firebase.dataconnect.OptionalVariable.Value(value_) }
              
            override var depositAmount: Double?
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { depositAmount = com.google.firebase.dataconnect.OptionalVariable.Value(value_) }
              
            override var status: String
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { status = value_ }
              
            override var emergencyContact: String?
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { emergencyContact = com.google.firebase.dataconnect.OptionalVariable.Value(value_) }
              
            override var emergencyPhone: String?
              get() = throw UnsupportedOperationException("getting builder values is not supported")
              set(value_) { emergencyPhone = com.google.firebase.dataconnect.OptionalVariable.Value(value_) }
              
            
          }.apply(block_)
          .let {
            Variables(
              fullName=fullName,email=email,phone=phone,roomNumber=roomNumber,moveInDate=moveInDate,leaseEndDate=leaseEndDate,monthlyRent=monthlyRent,depositAmount=depositAmount,status=status,emergencyContact=emergencyContact,emergencyPhone=emergencyPhone,
            )
          }
        }
      }
    
  }
  

  
    @kotlinx.serialization.Serializable
  public data class Data(
  
    val residentProfile_insert: ResidentProfileKey,
  
  ) {
    
    
  }
  

  public companion object {
    public val operationName: String = "CreateResident"

    public val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data> =
      kotlinx.serialization.serializer()

    public val variablesSerializer: kotlinx.serialization.SerializationStrategy<Variables> =
      kotlinx.serialization.serializer()
  }
}

public fun CreateResidentMutation.ref(
  
    fullName: String,email: String,phone: String,roomNumber: String,status: String,

  
    block_: CreateResidentMutation.Variables.Builder.() -> Unit = {}
  
): com.google.firebase.dataconnect.MutationRef<
    CreateResidentMutation.Data,
    CreateResidentMutation.Variables
  > =
  ref(
    
      CreateResidentMutation.Variables.build(
        fullName=fullName,email=email,phone=phone,roomNumber=roomNumber,status=status,
  
    block_
      )
    
  )

public suspend fun CreateResidentMutation.execute(

  
    
      fullName: String,email: String,phone: String,roomNumber: String,status: String,

  
    block_: CreateResidentMutation.Variables.Builder.() -> Unit = {}

  ): com.google.firebase.dataconnect.MutationResult<
    CreateResidentMutation.Data,
    CreateResidentMutation.Variables
  > =
  ref(
    
      fullName=fullName,email=email,phone=phone,roomNumber=roomNumber,status=status,
  
    block_
    
  ).execute()


