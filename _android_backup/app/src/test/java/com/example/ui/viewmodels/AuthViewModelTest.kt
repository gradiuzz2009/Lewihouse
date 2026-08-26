package com.example.ui.viewmodels

import app.cash.turbine.test
import com.example.data.security.AuthResult
import com.example.data.security.EncryptedSessionManager
import com.example.domain.usecase.AuthenticateTenantUseCase
import com.example.ui.common.UiState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.*

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var authenticateTenantUseCase: AuthenticateTenantUseCase
    private lateinit var sessionManager: EncryptedSessionManager
    private lateinit var viewModel: AuthViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        authenticateTenantUseCase = mock(AuthenticateTenantUseCase::class.java)
        sessionManager = mock(EncryptedSessionManager::class.java)

        `when`(sessionManager.isLoggedIn).thenReturn(false)
        `when`(sessionManager.userRole).thenReturn(AppRole.TENANT)
        `when`(sessionManager.selectedTenantId).thenReturn("res_204")

        viewModel = AuthViewModel(authenticateTenantUseCase, sessionManager)
    }

    @After
    fun teardown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loginSuccessFlow() = runTest {
        val successResult = AuthResult.Success(
            uid = "test_uid_123",
            role = AppRole.ADMIN,
            residentId = "admin_01",
            token = "jwt_token"
        )

        `when`(authenticateTenantUseCase("admin@lewihouse.id", AppRole.ADMIN, "AdminSecret123!"))
            .thenReturn(successResult)

        viewModel.uiState.test {
            val initialState = awaitItem()
            assertTrue(initialState is UiState.Success)

            viewModel.login("admin@lewihouse.id", AppRole.ADMIN, "AdminSecret123!")

            testDispatcher.scheduler.advanceUntilIdle()

            // State changes to Loading then Success
            val loadingState = awaitItem()
            assertTrue(loadingState is UiState.Loading)

            val successState = awaitItem()
            assertTrue(successState is UiState.Success)
            val data = (successState as UiState.Success).data
            assertTrue(data.isLoggedIn)
            assertEquals(AppRole.ADMIN, data.currentRole)
            assertEquals("admin_01", data.selectedTenantId)
        }
    }

    @Test
    fun loginInvalidCredentialsFlow() = runTest {
        `when`(authenticateTenantUseCase("bad@user.com", AppRole.TENANT, "wrongPass"))
            .thenReturn(AuthResult.InvalidCredentials)

        viewModel.uiState.test {
            awaitItem() // Initial

            viewModel.login("bad@user.com", AppRole.TENANT, "wrongPass")
            testDispatcher.scheduler.advanceUntilIdle()

            val loadingState = awaitItem()
            assertTrue(loadingState is UiState.Loading)

            val errorState = awaitItem()
            assertTrue(errorState is UiState.Error)
            assertEquals("Invalid credentials provided", (errorState as UiState.Error).message)
        }
    }
}
