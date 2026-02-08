#!/bin/bash

echo "🚀 Sistema de Gestión de Tareas - Script de Despliegue"
echo "======================================================"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instálalo primero."
    exit 1
fi

echo "✅ Node.js versión: $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado."
    exit 1
fi

echo "✅ npm versión: $(npm --version)"

# Verificar MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL no encontrado. Asegúrate de tenerlo instalado y corriendo."
    read -p "¿Deseas continuar de todos modos? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📁 Configurando base de datos..."
if command -v mysql &> /dev/null; then
    read -p "Contraseña de MySQL (presiona Enter si no tienes): " mysql_pass
    if [ -z "$mysql_pass" ]; then
        mysql -u root < mysql.sql
    else
        mysql -u root -p"$mysql_pass" < mysql.sql
    fi
    echo "✅ Base de datos configurada"
fi

echo ""
echo "📦 Instalando dependencias del backend..."
cd backend
npm install

echo ""
echo "⚙️  Configurando variables de entorno..."
if [ ! -f .env ]; then
    echo "✅ Archivo .env ya existe"
else
    echo "⚠️  El archivo .env ya existe. Por favor, revisa la configuración:"
    echo "   - DB_HOST=${DB_HOST:-localhost}"
    echo "   - DB_USER=${DB_USER:-root}"
    echo "   - DB_PASSWORD=${DB_PASSWORD:-}"
    echo "   - DB_NAME=${DB_NAME:-todo_db}"
    echo "   - PORT=${PORT:-3001}"
    echo "   - JWT_SECRET=${JWT_SECRET:-CAMBIAR_ESTO}"
fi

echo ""
echo "🔧 Iniciando servidor..."
echo "El servidor estará disponible en: http://localhost:3001"
echo "Presiona Ctrl+C para detener el servidor"
echo ""

npm start