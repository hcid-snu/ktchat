require 'pusher'

Pusher.url = "your pusher url"
class HomeController < ApplicationController
  respond_to :json

  def index
    gon.anew = AffectiveNorm.all;
  end

  def send_message

    Pusher['test_channel'].trigger('my_event', {
      sender: params[:sender],
      sessionID: params[:sessionID],
      content: params[:content],
      isKT: params[:isKT],
      words_energy: params[:words_energy],
      words_type: params[:words_type],
      emotionPos: params[:emotionPos]
    })

  end

  def session_id
    @session_id = { session_id: session.id }
    respond_with @session_id

  end

end
