package com.example.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.RoomUnit
import com.example.data.model.UnitStatus
import com.example.data.repository.RoomRepository
import com.example.ui.common.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class RoomFilter {
    ALL,
    VACANT,
    OCCUPIED,
    MAINTENANCE
}

@HiltViewModel
class AdminRoomsViewModel @Inject constructor(
    private val roomRepository: RoomRepository
) : ViewModel() {

    private val _selectedFilter = MutableStateFlow(RoomFilter.ALL)
    val selectedFilter: StateFlow<RoomFilter> = _selectedFilter.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val roomsUiState: StateFlow<UiState<List<RoomUnit>>> = combine(
        roomRepository.allRooms,
        _selectedFilter,
        _searchQuery
    ) { rooms, filter, query ->
        val filtered = rooms.filter { room ->
            val matchesFilter = when (filter) {
                RoomFilter.ALL -> true
                RoomFilter.VACANT -> room.status == UnitStatus.VACANT
                RoomFilter.OCCUPIED -> room.status == UnitStatus.OCCUPIED
                RoomFilter.MAINTENANCE -> room.status == UnitStatus.MAINTENANCE
            }
            val matchesQuery = if (query.isBlank()) true else {
                room.roomNumber.contains(query, ignoreCase = true) ||
                        (room.currentResidentName?.contains(query, ignoreCase = true) == true)
            }
            matchesFilter && matchesQuery
        }
        UiState.Success(filtered)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = UiState.Loading
    )

    fun setFilter(filter: RoomFilter) {
        _selectedFilter.value = filter
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun updateRoomStatus(roomId: String, newStatus: UnitStatus) {
        viewModelScope.launch {
            roomRepository.updateRoomStatus(roomId, newStatus)
        }
    }

    fun saveRoom(room: RoomUnit) {
        viewModelScope.launch {
            roomRepository.saveRoom(room)
        }
    }

    fun deleteRoom(roomId: String) {
        viewModelScope.launch {
            roomRepository.deleteRoom(roomId)
        }
    }
}
