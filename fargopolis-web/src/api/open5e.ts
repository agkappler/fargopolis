const BASE_URL = "https://api.open5e.com";

export async function getOpen5eClasses() {
    return fetch(BASE_URL + "/classes").then((response) => response.json());
}

export async function getOpen5eClass(className: string) {
    return fetch(BASE_URL + `/classes/${className}`).then((response) => response.json());
}

export async function getOpen5eRaces() {
    return fetch(BASE_URL + "/races").then((response) => response.json());
}