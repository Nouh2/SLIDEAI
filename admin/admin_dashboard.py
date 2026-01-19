"""
SlideAI Admin Dashboard
Streamlit dashboard for managing the SaaS during beta testing.

Usage:
  pip install streamlit supabase pandas plotly
  streamlit run admin_dashboard.py
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# ============================================
# CONFIGURATION
# ============================================

# Load from environment or set directly
SUPABASE_URL = os.getenv("SUPABASE_URL", "YOUR_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "YOUR_SERVICE_ROLE_KEY")

# Admin password (simple protection)
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "slideai2026")

# Plan options
PLAN_OPTIONS = ["free", "starter", "pro", "business"]


@st.cache_resource
def get_supabase_client() -> Client:
    """Initialize Supabase client with service role key."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================
# AUTH CHECK
# ============================================

def check_password():
    """Simple password authentication."""
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False

    if not st.session_state.authenticated:
        st.title("🔐 SlideAI Admin")
        password = st.text_input("Mot de passe admin", type="password")
        if st.button("Connexion"):
            if password == ADMIN_PASSWORD:
                st.session_state.authenticated = True
                st.rerun()
            else:
                st.error("Mot de passe incorrect")
        return False
    return True


# ============================================
# DATA LOADERS
# ============================================

@st.cache_data(ttl=60)
def load_users():
    """Load all users with their subscriptions."""
    supabase = get_supabase_client()
    
    # Get users from auth.users via Supabase
    response = supabase.table("User").select("*").execute()
    users = response.data if response.data else []
    
    # Get subscriptions
    subs_response = supabase.table("Subscription").select("*").execute()
    subs = {s["userId"]: s for s in (subs_response.data or [])}
    
    # Merge
    for user in users:
        sub = subs.get(user["id"], {})
        user["plan"] = sub.get("plan", "free")
        user["creditsRemaining"] = sub.get("creditsRemaining", 0)
        user["status"] = sub.get("status", "active")
    
    return users


@st.cache_data(ttl=60)
def load_presentations():
    """Load all presentations."""
    supabase = get_supabase_client()
    response = supabase.table("presentations").select("id, user_id, title, theme, created_at, updated_at").execute()
    return response.data if response.data else []


@st.cache_data(ttl=60)
def load_token_usage():
    """Load token usage data."""
    supabase = get_supabase_client()
    response = supabase.table("token_usage").select("*").order("created_at", desc=True).limit(1000).execute()
    return response.data if response.data else []


# ============================================
# ACTIONS
# ============================================

def update_user_plan(user_id: str, new_plan: str, reset_credits: bool = True):
    """Update a user's subscription plan."""
    supabase = get_supabase_client()
    
    plan_credits = {
        "free": 2,
        "starter": 15,
        "pro": 50,
        "business": 999
    }
    
    update_data = {"plan": new_plan}
    if reset_credits:
        update_data["creditsRemaining"] = plan_credits.get(new_plan, 2)
    
    response = supabase.table("Subscription").update(update_data).eq("userId", user_id).execute()
    
    if response.data:
        st.success(f"✅ Utilisateur mis à jour: {new_plan}")
        st.cache_data.clear()
    else:
        st.error("❌ Échec de la mise à jour")


def export_emails_csv(users, filter_plan=None):
    """Export user emails as CSV."""
    filtered = users
    if filter_plan and filter_plan != "Tous":
        filtered = [u for u in users if u.get("plan") == filter_plan]
    
    emails = [{"email": u["email"], "plan": u.get("plan", "free")} for u in filtered]
    return pd.DataFrame(emails)


# ============================================
# PAGES
# ============================================

def page_overview():
    """KPIs Overview page."""
    st.header("📊 Vue d'ensemble")
    
    users = load_users()
    presentations = load_presentations()
    token_usage = load_token_usage()
    
    # Plan pricing (monthly in EUR)
    PLAN_PRICES = {
        "free": 0,
        "starter": 9.99,
        "pro": 24.99,
        "business": 49.99
    }
    
    # Calculate MRR
    mrr_by_plan = {}
    for user in users:
        plan = user.get("plan", "free")
        status = user.get("status", "active")
        if status == "active" and plan != "free":
            mrr_by_plan[plan] = mrr_by_plan.get(plan, 0) + PLAN_PRICES.get(plan, 0)
    
    total_mrr = sum(mrr_by_plan.values())
    total_cost = sum(t.get("total_cost", 0) for t in token_usage)
    profit = total_mrr - total_cost
    
    # KPI Cards Row 1
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("👤 Utilisateurs", len(users))
    
    with col2:
        st.metric("📑 Présentations", len(presentations))
    
    with col3:
        total_tokens = sum(t.get("total_tokens", 0) for t in token_usage)
        st.metric("🎯 Tokens totaux", f"{total_tokens:,}")
    
    with col4:
        st.metric("💸 Coût IA", f"${total_cost:.2f}")
    
    # KPI Cards Row 2 - Revenue
    st.subheader("💰 Revenus Mensuels")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        paying_users = len([u for u in users if u.get("plan", "free") != "free" and u.get("status") == "active"])
        st.metric("💳 Abonnés payants", paying_users)
    
    with col2:
        st.metric("📈 MRR", f"€{total_mrr:.2f}")
    
    with col3:
        st.metric("💰 Profit estimé", f"€{profit:.2f}", delta=f"{(profit/total_mrr*100):.0f}% marge" if total_mrr > 0 else None)
    
    with col4:
        arpu = total_mrr / paying_users if paying_users > 0 else 0
        st.metric("� ARPU", f"€{arpu:.2f}")
    
    # MRR breakdown by plan
    if mrr_by_plan:
        st.caption("**Détail par plan:**")
        cols = st.columns(len(mrr_by_plan))
        for i, (plan, revenue) in enumerate(sorted(mrr_by_plan.items())):
            count = len([u for u in users if u.get("plan") == plan and u.get("status") == "active"])
            cols[i].metric(f"{plan.upper()}", f"€{revenue:.2f}", f"{count} abonnés")
    
    st.divider()
    
    # Plan distribution
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Répartition par plan")
        plan_counts = {}
        for u in users:
            plan = u.get("plan", "free")
            plan_counts[plan] = plan_counts.get(plan, 0) + 1
        
        if plan_counts:
            fig = px.pie(
                names=list(plan_counts.keys()),
                values=list(plan_counts.values()),
                color_discrete_sequence=px.colors.qualitative.Set2
            )
            st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("Créations par jour (7 derniers jours)")
        if presentations:
            df = pd.DataFrame(presentations)
            df["date"] = pd.to_datetime(df["created_at"]).dt.date
            daily = df.groupby("date").size().reset_index(name="count")
            fig = px.bar(daily, x="date", y="count", color_discrete_sequence=["#667eea"])
            st.plotly_chart(fig, use_container_width=True)
    
    # Token usage over time
    st.subheader("💰 Consommation de tokens")
    if token_usage:
        df = pd.DataFrame(token_usage)
        df["date"] = pd.to_datetime(df["created_at"]).dt.date
        daily_cost = df.groupby("date")["total_cost"].sum().reset_index()
        fig = px.area(daily_cost, x="date", y="total_cost", 
                      labels={"total_cost": "Coût ($)", "date": "Date"},
                      color_discrete_sequence=["#f093fb"])
        st.plotly_chart(fig, use_container_width=True)


def page_users():
    """User management page."""
    st.header("👤 Gestion des utilisateurs")
    
    users = load_users()
    presentations = load_presentations()
    
    # Count presentations per user
    pres_count = {}
    for p in presentations:
        uid = p.get("user_id")
        pres_count[uid] = pres_count.get(uid, 0) + 1
    
    # Search
    search = st.text_input("🔍 Rechercher par email", placeholder="exemple@email.com")
    
    filtered_users = users
    if search:
        filtered_users = [u for u in users if search.lower() in u.get("email", "").lower()]
    
    st.write(f"**{len(filtered_users)} utilisateur(s) trouvé(s)**")
    
    # User table
    for user in filtered_users[:50]:  # Limit to 50
        with st.expander(f"📧 {user.get('email', 'N/A')} — **{user.get('plan', 'free').upper()}**"):
            col1, col2, col3 = st.columns([2, 2, 2])
            
            with col1:
                st.write(f"**ID:** `{user.get('id', 'N/A')[:8]}...`")
                st.write(f"**Crédits:** {user.get('creditsRemaining', 0)}")
                st.write(f"**Présentations:** {pres_count.get(user.get('id'), 0)}")
            
            with col2:
                st.write(f"**Plan actuel:** {user.get('plan', 'free')}")
                st.write(f"**Statut:** {user.get('status', 'active')}")
            
            with col3:
                new_plan = st.selectbox(
                    "Changer le plan",
                    PLAN_OPTIONS,
                    index=PLAN_OPTIONS.index(user.get("plan", "free")),
                    key=f"plan_{user['id']}"
                )
                reset = st.checkbox("Reset crédits", value=True, key=f"reset_{user['id']}")
                
                if st.button("💾 Mettre à jour", key=f"update_{user['id']}"):
                    update_user_plan(user["id"], new_plan, reset)


def page_emails():
    """Email export page."""
    st.header("📧 Export des emails")
    
    users = load_users()
    
    # Filter options
    col1, col2 = st.columns(2)
    with col1:
        plan_filter = st.selectbox("Filtrer par plan", ["Tous"] + PLAN_OPTIONS)
    
    # Preview
    df = export_emails_csv(users, plan_filter if plan_filter != "Tous" else None)
    
    st.write(f"**{len(df)} email(s) à exporter**")
    st.dataframe(df, use_container_width=True)
    
    # Download button
    csv = df.to_csv(index=False)
    st.download_button(
        label="⬇️ Télécharger CSV",
        data=csv,
        file_name=f"slideai_emails_{datetime.now().strftime('%Y%m%d')}.csv",
        mime="text/csv"
    )


def page_tokens():
    """Token usage tracking page."""
    st.header("💰 Suivi des tokens et coûts")
    
    token_usage = load_token_usage()
    
    if not token_usage:
        st.info("Aucune donnée de consommation de tokens pour le moment.")
        return
    
    df = pd.DataFrame(token_usage)
    
    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Input", f"{df['input_tokens'].sum():,}")
    with col2:
        st.metric("Total Output", f"{df['output_tokens'].sum():,}")
    with col3:
        st.metric("Coût Input", f"${df['input_cost'].sum():.4f}")
    with col4:
        st.metric("Coût Output", f"${df['output_cost'].sum():.4f}")
    
    st.divider()
    
    # By job type
    st.subheader("Consommation par type de job")
    by_type = df.groupby("job_type").agg({
        "total_tokens": "sum",
        "total_cost": "sum"
    }).reset_index()
    
    fig = px.bar(by_type, x="job_type", y="total_cost", 
                 color="job_type",
                 labels={"total_cost": "Coût ($)", "job_type": "Type"})
    st.plotly_chart(fig, use_container_width=True)
    
    # Recent usage table
    st.subheader("Dernières consommations")
    display_df = df[["created_at", "job_type", "input_tokens", "output_tokens", "total_cost", "user_id"]].head(20)
    display_df["user_id"] = display_df["user_id"].str[:8] + "..."
    display_df["total_cost"] = display_df["total_cost"].apply(lambda x: f"${x:.6f}")
    st.dataframe(display_df, use_container_width=True)


# ============================================
# MAIN APP
# ============================================

def main():
    st.set_page_config(
        page_title="SlideAI Admin",
        page_icon="🎛️",
        layout="wide"
    )
    
    if not check_password():
        return
    
    # Sidebar navigation
    st.sidebar.title("🎛️ SlideAI Admin")
    st.sidebar.divider()
    
    page = st.sidebar.radio(
        "Navigation",
        ["📊 Vue d'ensemble", "👤 Utilisateurs", "📧 Export Emails", "💰 Tokens & Coûts"]
    )
    
    st.sidebar.divider()
    if st.sidebar.button("🔄 Rafraîchir les données"):
        st.cache_data.clear()
        st.rerun()
    
    if st.sidebar.button("🚪 Déconnexion"):
        st.session_state.authenticated = False
        st.rerun()
    
    # Route to page
    if page == "📊 Vue d'ensemble":
        page_overview()
    elif page == "👤 Utilisateurs":
        page_users()
    elif page == "📧 Export Emails":
        page_emails()
    elif page == "💰 Tokens & Coûts":
        page_tokens()


if __name__ == "__main__":
    main()
