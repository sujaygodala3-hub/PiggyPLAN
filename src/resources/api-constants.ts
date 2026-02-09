const baseUrl = 'https://6791bc30cf994cc680475051.mockapi.io/finwise/v1'

export const getData = (userId: number): string => {
    return baseUrl + '/data/' + userId
}

export const getUsers = (userId: number): string => {
    return baseUrl + '/users'
}

export const getUser = (userId: number): string => {
    return baseUrl + '/users/' + userId
}

export const getTrans = (userId: number): string => {
    return baseUrl + '/trans'
}

export const getTran = (tranId: number): string => {
    return baseUrl + '/trans/' + tranId
}