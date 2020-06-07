import React, { useEffect, useState, ChangeEvent, PointerEvent, FormEvent, KeyboardEvent } from "react";
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { Map, TileLayer, Marker, Popup } from "react-leaflet";
import { LeafletMouseEvent } from "leaflet";
import axios from 'axios';
import api from '../../services/api';

import logo from "../../assets/logo.svg";
import "./style.css";

interface Item {
    id: number;
    image_url: string;
    title: string;
}

interface State {
    name: string;
    initial: string;
}

interface City {
    id: number;
    name: string;
}

interface PointForm {
    name: string;
    email: string;
    whatsapp: string;
    latitude: number;
    longitude: number;
    uf: string[2];
    city: string;
    items: number[];
}

interface IBGEUFResponse {
    sigla: string;
    nome: string;
}

interface IBGECityResponse {
    id: number;
    nome: string;
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [selectedItems, setSelectedItems] = useState<Item[]>([]);
    const [whatsapp, setWhatsapp] = useState<string>("");

    const [currentPosition, setCurrentPosition] = useState<[number, number]>([0, 0]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);

    const [selectedUf, setSelectedUf] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [formData, setFormData] = useState<PointForm>({
        name: "", city: "", email: "", whatsapp: "", 
        latitude: 0, longitude: 0, uf: "", items: []
    });

    const history = useHistory();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(response => {
            const { latitude, longitude } = response.coords
            
            if(latitude && longitude) {
                setCurrentPosition([
                    latitude,
                    longitude
                ])
                
                setSelectedPosition([
                    latitude,
                    longitude
                ])
            }
        }, (err) => {
            setCurrentPosition([
                -13.6562901,
                -69.7292625
            ])
        }, { enableHighAccuracy: true})

    }, []);

    useEffect(() => {
        api.get("items").then(response => {
            setItems(response.data);
        });

    }, []);
    
    useEffect(() => {
        axios.get<IBGEUFResponse[]>("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome").then(response => {
            const ufInitialsAndName = response.data.map(uf => {
                return {
                    name: uf.nome,
                    initial: uf.sigla
                }
            })

            setStates(ufInitialsAndName);
        });
    }, []);
    
    useEffect(() => {
        if(selectedUf !== "") {
            axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/distritos?orderBy=nome`).then(response => {
                const cities = response.data.map(city => {
                    return {
                        id: city.id,
                        name: city.nome,
                    }
                });

                setCities(cities);
                document.getElementById("city")?.removeAttribute("disabled")
            });
        } else {
            setCities([])
            document.getElementById("city")?.setAttribute("disabled", "true")
        }
    }, [selectedUf]);

    function handleChangeItemsToCollect(event: PointerEvent<HTMLLIElement>) {
        const id = event.currentTarget.getAttribute("itemid")
        const itemIsInsertedInArray = selectedItems
        .some(item => item.id === Number(id))

        if(!itemIsInsertedInArray) {
            const item = {
                id: Number(id),
                image_url: String(event.currentTarget.querySelector("img")?.src),
                title: String(event.currentTarget.querySelector("span")?.innerText)
            }

            setSelectedItems([...selectedItems, item])
        } else {
            const newItemsCollected = selectedItems.filter(item => item.id !== Number(id))

            setSelectedItems(newItemsCollected)
        }

        event.currentTarget.classList.toggle("selected", !itemIsInsertedInArray)
    }
    
    function handleChangeSelectedUf(event: ChangeEvent<HTMLSelectElement>) {
        const value = event.target.value
        setSelectedUf(value);
    }
    
    function handleChangeSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
        const value = event.target.value
        setSelectedCity(value);
    }

    function handleChangeSelectedPosition(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ]);
    }

    function formatPhone(input: HTMLInputElement) {
        let value = input.value
        value = value.replace(/\D/g, "")
        
        value = value.replace(/(\d{2,3})(\d{5})(\d\d\d\d)/, "$1 $2-$3")
        setWhatsapp(value)
    }

    function handleChangeInputValue(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target

        setFormData({...formData, [name]: value})
        formatPhone(event.target)
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setFormData(
        {
            ...formData,
            latitude: selectedPosition[0],
            longitude: selectedPosition[1],
            uf: selectedUf,
            city: selectedCity,
            items: selectedItems.map(item => item.id)
        })
        
        await api.post("/points", formData)

        document.getElementById("modal")?.classList.remove("hide")
        
        setTimeout(() => {
            history.push("/")
        }, 3000);
    }

    return (
        <>
            <div id="page-create-point">
                <header>
                    <img src={logo} alt="Ecoleta"/>

                    <Link to="/">
                        <FiArrowLeft />
                        Voltar para home
                    </Link>
                </header>

                <form onSubmit={handleSubmit}>
                    <h1>Cadastro do<br/> ponto de coleta</h1>

                    <fieldset>
                        <legend>
                            <h2>Dados</h2>
                        </legend>
                        <div className="field">
                            <label htmlFor="name">Nome da entidade</label>
                            <input 
                                type="text" 
                                id="name"
                                name="name"
                                onChange={handleChangeInputValue}
                            />
                        </div>

                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="email">Email</label>
                                <input 
                                type="text" 
                                name="email" 
                                id="email"
                                onChange={handleChangeInputValue}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="whatsapp">Whatsapp</label>
                                <input 
                                type="text" 
                                name="whatsapp" 
                                id="whatsapp"
                                value={whatsapp}
                                maxLength={14}
                                onChange={handleChangeInputValue}
                                />
                            </div>
                        </div>
                        
                    </fieldset>
                    
                    <fieldset>
                        <legend>
                            <h2>Endereço</h2>
                            <span>Selecione o endereço no mapa</span>
                        </legend>

                        <Map center={currentPosition} zoom={14} onClick={handleChangeSelectedPosition}>
                            <TileLayer
                                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <Marker position={selectedPosition}>
                                <Popup>Seu local de coleta.</Popup>
                            </Marker>
                        </Map>

                        <div className="field-group">
                            <div className="field">
                                <label 
                                htmlFor="uf">Estado (UF)</label>
                                <select 
                                name="uf" 
                                id="uf" 
                                value={selectedUf} 
                                onChange={handleChangeSelectedUf}>
                                    <option value="">Selecione o Estado</option>
                                    { states.map(state => (
                                        <option key={state.initial} value={state.initial}>{state.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="field">
                                <label 
                                htmlFor="city">Cidade</label>
                                <select 
                                name="city" 
                                id="city" 
                                value={selectedCity} 
                                onChange={handleChangeSelectedCity}>
                                    <option value="">Selecione a Cidade</option>
                                    { cities.map(city => (
                                        <option 
                                        key={city.id} 
                                        value={city.name}>{city.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    
                    <fieldset>
                        <legend>
                            <h2>Itens de coleta</h2>
                            <span>Selecione um ou mais itens abaixo</span>
                        </legend>

                        <ul className="items-grid">
                            { items.map((item) => (
                                <li key={item.id} itemID={String(item.id)} onClick={handleChangeItemsToCollect}>
                                    <img src={item.image_url} alt={item.title}/>
                                    <span>{item.title}</span>
                                </li>
                            ))}
                        </ul>
                    </fieldset>

                    <button type="submit">Cadastrar ponto de coleta</button>
                </form>
            </div>
            <div id="modal" className="point hide">
                <div className="success">
                    <FiCheckCircle />
                    <h2>Cadastrado com sucesso!</h2>
                </div>
            </div>
        </>
    );
}

export default CreatePoint;