from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.settings import AppSettings
from app.schemas.settings import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    setting_row = db.query(AppSettings).filter(AppSettings.settings_key == "global_config").first()
    if setting_row and setting_row.settings_value:
        return SettingsResponse(**setting_row.settings_value)
    return SettingsResponse()


@router.patch("", response_model=SettingsResponse)
def update_settings(update_in: SettingsUpdate, db: Session = Depends(get_db)):
    setting_row = db.query(AppSettings).filter(AppSettings.settings_key == "global_config").first()
    current_val = setting_row.settings_value if setting_row else SettingsResponse().model_dump()

    updated_dict = {**current_val, **{k: v for k, v in update_in.model_dump().items() if v is not None}}

    if not setting_row:
        setting_row = AppSettings(settings_key="global_config", settings_value=updated_dict)
        db.add(setting_row)
    else:
        setting_row.settings_value = updated_dict

    db.commit()
    return SettingsResponse(**updated_dict)
